package proxy

import (
	"fmt"
	"log"
	"math/big"
	"strconv"
	"strings"
	//_"github.com/davecgh/go-spew/spew"

	"github.com/wfr/ethash-nh"
	"github.com/ethereum/go-ethereum/common"

	"github.com/sammy007/open-ethereum-pool/util"
)

var hasher = ethash.New()

func (s *ProxyServer) processShare(login, id, ip string, t *BlockTemplate, params []string, nicehash bool) (bool, bool, error) {
	nonceHex := params[0]
	hashNoNonce := params[1]
	mixDigest := params[2]
	nonce, _ := strconv.ParseUint(strings.Replace(nonceHex, "0x", "", -1), 16, 64)
	shareDiff := s.config.Proxy.Difficulty

	if nicehash {
		hashNoNonceTmp := common.HexToHash(params[2])

		// Block "difficulty" is BigInt
		// NiceHash "difficulty" is float64 ...
		// diffFloat => target; then: diffInt = 2^256 / target

		shareDiffFloat, mixDigestTmp := hasher.GetShareDiff(t.Height, hashNoNonceTmp, nonce)
		// temporary
		if shareDiffFloat < 0.0001 {
			log.Printf("share difficulty too low, %f < %d, from %v@%v", shareDiffFloat, t.Difficulty, login, ip)
			return false, false, nil
		}
		// temporary hack, ignore round errors
		shareDiffFloat = shareDiffFloat * 0.98

		shareDiff_big := util.DiffFloatToDiffInt(shareDiffFloat)
		shareDiffCalc := shareDiff_big.Int64()

		log.Printf(">>> hashNoNonce = %v, mixDigest = %v, shareDiff = %v, sharedFloat = %v\n",
			hashNoNonceTmp.Hex(), mixDigestTmp.Hex(), shareDiffCalc, shareDiffFloat)

		params[1] = hashNoNonceTmp.Hex()
		params[2] = mixDigestTmp.Hex()
		hashNoNonce = params[1]
		mixDigest = params[2]
	}

	h, ok := t.headers[hashNoNonce]
	if !ok {
		log.Printf("Stale share from %v@%v", login, ip)
		return false, false, nil
	}

	share := Block{
		number:      h.height,
		hashNoNonce: common.HexToHash(hashNoNonce),
		difficulty:  big.NewInt(shareDiff),
		nonce:       nonce,
		mixDigest:   common.HexToHash(mixDigest),
	}

	block := Block{
		number:      h.height,
		hashNoNonce: common.HexToHash(hashNoNonce),
		difficulty:  h.diff,
		nonce:       nonce,
		mixDigest:   common.HexToHash(mixDigest),
	}

	if !hasher.Verify(share) {
		return false, false, nil
	}

	if hasher.Verify(block) {
		ok, err := s.rpc().SubmitBlock(params)
		if err != nil {
			log.Printf("Block submission failure at height %v for %v: %v", h.height, t.Header, err)
		} else if !ok {
			log.Printf("Block rejected at height %v for %v", h.height, t.Header)
			return false, false, nil
		} else {
			s.fetchBlockTemplate()
			exist, err := s.backend.WriteBlock(login, id, params, shareDiff, h.diff.Int64(), h.height, s.hashrateExpiration)
			if exist {
				return true, false, nil
			}
			if err != nil {
				log.Println("Failed to insert block candidate into backend:", err)
			} else {
				log.Printf("Inserted block %v to backend", h.height)
			}
			log.Printf("Block found by miner %v@%v at height %d", login, ip, h.height)
		}
	} else {
		// check hashrate limit
		if s.config.Proxy.HashLimit > 0 {
			currentHashrate, _ := s.backend.GetCurrentHashrate(login)

			if s.config.Proxy.HashLimit > 0 && currentHashrate > s.config.Proxy.HashLimit {
				err := fmt.Errorf("hashLimit exceed: %v(current) > %v(hashLimit)", currentHashrate, s.config.Proxy.HashLimit)
				log.Println("Failed to insert share data into backend:", err)
				return false, false, err
			}
		}

		exist, err := s.backend.WriteShare(login, id, params, shareDiff, h.height, s.hashrateExpiration)
		if exist {
			return true, false, nil
		}
		if err != nil {
			log.Println("Failed to insert share data into backend:", err)
		}
	}
	return false, true, nil
}
