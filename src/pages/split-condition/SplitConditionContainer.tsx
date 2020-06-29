import React, { useState, useEffect, useCallback } from 'react'
import { useWeb3Connected } from '../../contexts/Web3Context'
import { BigNumber } from 'ethers/utils'
import { useAllowance } from '../../hooks/useAllowance'
import { Remote } from '../../util/remoteData'
import { constants, ethers } from 'ethers'
import { SplitCondition } from './index'
import { ConditionalTokensService } from 'services/conditionalTokens'

export const SplitConditionContainer = () => {
  const { networkConfig, provider, CTService } = useWeb3Connected()
  const tokens = networkConfig.getTokens()
  const [collateralToken, setCollateralToken] = useState(tokens[0].address)
  const { refresh, unlock } = useAllowance(collateralToken)
  const [allowance, setAllowance] = useState<Remote<BigNumber>>(Remote.notAsked<BigNumber>())
  const [hasUnlockedCollateral, setHasUnlockedCollateral] = useState(false)

  const unlockCollateral = async () => {
    setAllowance(Remote.loading())
    try {
      const { transactionHash } = await unlock()
      if (transactionHash) {
        await provider.waitForTransaction(transactionHash)
        setAllowance(Remote.success(constants.MaxUint256))
      }
    } catch (e) {
      setAllowance(Remote.failure(e))
    } finally {
      setHasUnlockedCollateral(true)
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
  }, [collateralToken])

  const splitPosition = async (
    collateral: string,
    parentCollection: string,
    conditionId: string,
    partition: BigNumber[],
    amount: BigNumber
  ) => {
    partition.forEach((indexSet) => {
      const collectionId = ConditionalTokensService.getCollectionId(
        parentCollection,
        conditionId,
        indexSet
      )

      const positionId = ConditionalTokensService.getPositionId(collateralToken, collectionId)
      console.log(
        `conditionId: ${conditionId} / parentCollection: ${parentCollection} / indexSet: ${indexSet.toString()}`
      )
      console.log(`Position: ${positionId}`)
    })

    const tx = await CTService.splitPosition(
      collateral,
      parentCollection,
      conditionId,
      partition,
      amount
    )

    try {
      await provider.waitForTransaction(tx)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <SplitCondition
      allowance={allowance}
      splitPosition={splitPosition}
      unlockCollateral={unlockCollateral}
      onCollateralChange={(collateral: string) => setCollateralToken(collateral)}
      hasUnlockedCollateral={hasUnlockedCollateral}
      ctService={CTService}
      tokens={tokens}
    ></SplitCondition>
  )
}
