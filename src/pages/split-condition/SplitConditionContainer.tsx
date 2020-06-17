import React, { useState, useEffect, useCallback } from 'react'
import { useWeb3Connected } from '../../contexts/Web3Context'
import { BigNumber } from 'ethers/utils'
import { useAllowance } from '../../hooks/useAllowance'
import { Remote } from '../../util/remoteData'
import { constants } from 'ethers'
import { SplitCondition } from './index'
import { Token } from '../../config/networkConfig'

export const SplitConditionContainer = () => {
  const { networkConfig, provider } = useWeb3Connected()
  const tokens = networkConfig.getTokens()
  const [collateral, setCollateral] = useState(tokens[0].address)
  const { refresh, unlock } = useAllowance(collateral)
  const [allowance, setAllowance] = useState<Remote<BigNumber>>(Remote.notAsked<BigNumber>())
  const [hasUnlockedCollateral, setHasUnlockedCollateral] = useState(false)

  const unlockCollateral = async () => {
    setAllowance(Remote.loading())
    const { transactionHash } = await unlock()
    if (transactionHash) {
      await provider.waitForTransaction(transactionHash)
      setHasUnlockedCollateral(true)
      setAllowance(Remote.success(constants.MaxUint256))
    }
  }

  const fetchAllowance = useCallback(async () => {
    try {
      const allowance = await refresh()
      setAllowance(Remote.success(allowance))
    } catch (e) {
      setAllowance(Remote.failure(e))
    }
  }, [refresh])

  useEffect(() => {
    fetchAllowance()
  }, [fetchAllowance])

  useEffect(() => {
    setHasUnlockedCollateral(false)
  }, [collateral])

  return (
    <SplitCondition
      allowance={allowance}
      unlockCollateral={unlockCollateral}
      onCollateralChange={(collateral: string) => setCollateral(collateral)}
      hasUnlockedCollateral={hasUnlockedCollateral}
    ></SplitCondition>
  )
}
