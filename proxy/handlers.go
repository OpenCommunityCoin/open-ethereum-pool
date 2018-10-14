package proxy

import (
	"fmt"
	"log"
	"regexp"
	"strings"
	"errors"

	"github.com/sammy007/open-ethereum-pool/rpc"
	"github.com/sammy007/open-ethereum-pool/util"
)

// Allow only lowercase hexadecimal with 0x prefix
var noncePattern = regexp.MustCompile("^0x[0-9a-f]{16}$")
var hashPattern = regexp.MustCompile("^0x[0-9a-f]{64}$")
var workerPattern = regexp.MustCompile("^[0-9a-zA-Z-_]{1,8}$")

// Stratum
func (s *ProxyServer) handleLoginRPC(cs *Session, params []string, id string) (bool, *ErrorReply) {
	if len(params) == 0 {
		return false, &ErrorReply{Code: -1, Message: "Invalid params"}
	}

	login := strings.ToLower(params[0])
	if !util.IsValidHexAddress(login) {
		return false, &ErrorReply{Code: -1, Message: "Invalid login"}
	}
	if !s.policy.ApplyLoginPolicy(login, cs.ip) {
		return false, &ErrorReply{Code: -1, Message: "You are blacklisted"}
	}
	cs.login = login
	s.registerSession(cs)
	log.Printf("Stratum miner connected %v@%v", login, cs.ip)
	return true, nil
}

func (s *ProxyServer) handleGetWorkRPC(cs *Session) ([]string, *ErrorReply) {
	t := s.currentBlockTemplate()
	if t == nil || len(t.Header) == 0 || s.isSick() {
		return nil, &ErrorReply{Code: 0, Message: "Work not ready"}
	}
	return []string{t.Header, t.Seed, s.diff}, nil
}

// Stratum
func (s *ProxyServer) handleTCPSubmitRPC(cs *Session, id string, params []string) (bool, *ErrorReply) {
	s.sessionsMu.RLock()
	_, ok := s.sessions[cs]
	s.sessionsMu.RUnlock()

	if !ok {
		return false, &ErrorReply{Code: 25, Message: "Not subscribed"}
	}
	return s.handleSubmitRPC(cs, cs.login, id, params)
}

func (s *ProxyServer) handleSubmitRPC(cs *Session, login, id string, params []string) (bool, *ErrorReply) {
	if !workerPattern.MatchString(id) {
		id = "0"
	}
	if len(params) != 3 {
		s.policy.ApplyMalformedPolicy(cs.ip)
		log.Printf("Malformed params from %s@%s %v", login, cs.ip, params)
		return false, &ErrorReply{Code: -1, Message: "Invalid params"}
	}

	// nicehash hack FIXME
	isNicehash := 0
	for i := 0; i <= 2; i++ {
		if params[i][0:2] != "0x" {
			log.Printf("handleSubmitRPC, params[%d] = %s, len = %d", i, params[i], len(params[i]))
			params[i] = "0x" + params[i]
			isNicehash++
		}
	}
	if isNicehash != 3 {
		isNicehash = 0
	}

	if !noncePattern.MatchString(params[0]) || !hashPattern.MatchString(params[1]) || !hashPattern.MatchString(params[2]) {
		s.policy.ApplyMalformedPolicy(cs.ip)
		log.Printf("Malformed PoW result from %s@%s %v", login, cs.ip, params)
		return false, &ErrorReply{Code: -1, Message: "Malformed PoW result"}
	}

	go func(s *ProxyServer, cs *Session, login, id string, params []string) {
		t := s.currentBlockTemplate()
		exist, validShare, extraErr := s.processShare(login, id, cs.ip, t, params, isNicehash != 0)
		ok := s.policy.ApplySharePolicy(cs.ip, !exist && validShare && extraErr == nil)

		if exist {
			log.Printf("Duplicate share from %s@%s %v", login, cs.ip, params)
			// see https://github.com/sammy007/open-ethereum-pool/compare/master...nicehashdev:patch-1
			if !ok {
				cs.lastErr = errors.New("Invalid share")
				return
			}
			cs.lastErr = errors.New("Duplicate share")
			return
		}

		if extraErr != nil {
			log.Printf("Invalid share from %s@%s: %v", login, cs.ip, extraErr)
			// Bad shares limit reached, return error and close
			if !ok {
				cs.lastErr = errors.New("Invalid share")
				return
			}
			cs.lastErr = errors.New(fmt.Sprintf("Invalid share : %v", extraErr))
			return
		}

		if !validShare {
			log.Printf("Invalid share from %s@%s", login, cs.ip)
			// Bad shares limit reached, return error and close
			if !ok {
				cs.lastErr = errors.New("Invalid share")
				return
			}
		}
		if s.config.Proxy.Debug {
			log.Printf("Valid share from %s@%s", login, cs.ip)
		}

		if !ok {
			cs.lastErr = errors.New("High rate of invalid shares")
		}
	}(s, cs, login, id, params)

	return true, nil
}

func (s *ProxyServer) handleGetBlockByNumberRPC() *rpc.GetBlockReplyPart {
	t := s.currentBlockTemplate()
	var reply *rpc.GetBlockReplyPart
	if t != nil {
		reply = t.GetPendingBlockCache
	}
	return reply
}

func (s *ProxyServer) handleUnknownRPC(cs *Session, m string) *ErrorReply {
	log.Printf("Unknown request method %s from %s", m, cs.ip)
	s.policy.ApplyMalformedPolicy(cs.ip)
	return &ErrorReply{Code: -3, Message: "Method not found"}
}
