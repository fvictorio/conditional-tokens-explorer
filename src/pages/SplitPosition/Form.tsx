import { positionString } from 'util/tools'

import { BigNumber } from 'ethers/utils'
import { AllowanceMethods, useAllowanceState } from 'hooks/useAllowanceState'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ERC20Service } from 'services/erc20'
import styled from 'styled-components'
import { GetCondition_condition, GetPosition_position } from 'types/generatedGQL'

import { Button } from '../../components/buttons/Button'
import { CenteredCard } from '../../components/common/CenteredCard'
import { SetAllowance } from '../../components/common/SetAllowance'
import { InputAmount } from '../../components/form/InputAmount'
import { InputCondition } from '../../components/form/InputCondition'
import { Partition } from '../../components/partitions/Partition'
import { ButtonContainer } from '../../components/pureStyledComponents/ButtonContainer'
import { ErrorContainer, Error as ErrorMessage } from '../../components/pureStyledComponents/Error'
import { Row } from '../../components/pureStyledComponents/Row'
import { StripedList, StripedListItem } from '../../components/pureStyledComponents/StripedList'
import { TitleControl } from '../../components/pureStyledComponents/TitleControl'
import { FullLoading } from '../../components/statusInfo/FullLoading'
import { IconTypes } from '../../components/statusInfo/common'
import { TitleValue } from '../../components/text/TitleValue'
import { NULL_PARENT_ID, ZERO_BN } from '../../config/constants'
import { useConditionContext } from '../../contexts/ConditionContext'
import { Web3ContextStatus, useWeb3ConnectedOrInfura } from '../../contexts/Web3Context'
import { getLogger } from '../../util/logger'
import { trivialPartition } from '../../util/tools'
import { Token } from '../../util/types'

import { SplitFrom } from './SplitFrom'

const StripedListStyled = styled(StripedList)`
  margin-top: 6px;
`

const PartitionStyled = styled(Partition)`
  margin-top: 6px;
`

export type SplitFrom = 'collateral' | 'position'

export type SplitPositionFormMethods = {
  amount: BigNumber
  collateral: string
  conditionId: string
  positionId: string
  splitFrom: SplitFrom
}

interface Props {
  allowanceMethods: AllowanceMethods
  onCollateralChange: (collateral: string) => void
  splitPosition: (
    collateral: string,
    parentCollection: string,
    conditionId: string,
    partition: BigNumber[],
    amount: BigNumber
  ) => void
  tokens: Token[]
}

const logger = getLogger('Form')

export const Form = ({ allowanceMethods, onCollateralChange, splitPosition, tokens }: Props) => {
  const { _type: status, provider, signer } = useWeb3ConnectedOrInfura()
  const { clearCondition } = useConditionContext()

  const DEFAULT_VALUES = useMemo(() => {
    return {
      conditionId: '',
      collateral: tokens[0].address,
      amount: ZERO_BN,
      splitFrom: 'collateral' as SplitFrom,
      positionId: '',
    }
  }, [tokens])

  const formMethods = useForm<SplitPositionFormMethods>({
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  })

  const {
    formState: { isValid },
    getValues,
    handleSubmit,
    reset,
    watch,
  } = formMethods

  const [outcomeSlot, setOutcomeSlot] = useState(0)
  const [conditionIdToPreviewShow, setConditionIdToPreviewShow] = useState('')
  const [collateralToken, setCollateralToken] = useState(tokens[0])
  const [position, setPosition] = useState<Maybe<GetPosition_position>>(null)
  const [isTransactionExecuting, setIsTransactionExecuting] = useState(false)
  const [error, setError] = useState<Maybe<Error>>(null)

  const { amount, collateral, positionId, splitFrom } = getValues() as SplitPositionFormMethods

  const handleConditionChange = useCallback((condition: Maybe<GetCondition_condition>) => {
    setOutcomeSlot(condition ? condition.outcomeSlotCount : 0)
    setConditionIdToPreviewShow(condition ? condition.id : '')
  }, [])

  watch('collateral')
  watch('splitFrom')

  const splitFromCollateral = splitFrom === 'collateral'
  const splitFromPosition = splitFrom === 'position'

  const onSubmit = useCallback(
    async ({ amount, collateral, conditionId }: SplitPositionFormMethods) => {
      try {
        setIsTransactionExecuting(true)
        const partition = trivialPartition(outcomeSlot)

        if (splitFromCollateral) {
          await splitPosition(collateral, NULL_PARENT_ID, conditionId, partition, amount)
        } else if (splitFromPosition && position) {
          const {
            collateralToken: { id: collateral },
            collection: { id: collectionId },
          } = position
          await splitPosition(collateral, collectionId, conditionId, partition, amount)
        } else {
          throw Error('Invalid split origin')
        }
      } catch (err) {
        logger.error(err)
        setError(err)
      } finally {
        setIsTransactionExecuting(false)
        reset(DEFAULT_VALUES)
        // Clear condition manually, the reset doesn't work, the use of the conditionContext and react hook form is not so good
        clearCondition()
      }
    },
    [
      outcomeSlot,
      splitFromCollateral,
      splitFromPosition,
      position,
      splitPosition,
      reset,
      DEFAULT_VALUES,
      clearCondition,
    ]
  )

  useEffect(() => {
    let isSubscribed = true

    const fetchToken = async (collateral: string) => {
      if (status === Web3ContextStatus.Connected && signer) {
        const erc20Service = new ERC20Service(provider, signer, collateral)
        const token = await erc20Service.getProfileSummary()
        if (isSubscribed) {
          setCollateralToken(token)
        }
      }
    }

    if (splitFromCollateral) {
      const collateralToken = tokens.find((t) => t.address === collateral) || tokens[0]
      setCollateralToken(collateralToken)
    } else if (splitFromPosition) {
      fetchToken(collateral)
    }

    return () => {
      isSubscribed = false
    }
  }, [
    splitFromPosition,
    provider,
    onCollateralChange,
    tokens,
    collateral,
    splitFromCollateral,
    status,
    signer,
  ])

  const {
    allowanceFinished,
    fetchingAllowance,
    shouldDisplayAllowance,
    unlockCollateral,
  } = useAllowanceState(allowanceMethods, amount)

  const canSubmit = isValid && allowanceFinished
  const mockedNumberedOutcomes = [
    [1, 4, 3],
    [6, 5],
    [9, 7, 10],
    [2, 8],
    [12, 13, 14, 15],
  ]

  const splitPositionPreview = useMemo(() => {
    if (position) {
      return trivialPartition(outcomeSlot).map((indexSet) => {
        return positionString(
          [...position.conditionIds, conditionIdToPreviewShow],
          [...[position.indexSets], indexSet],
          amount,
          collateralToken
        )
      })
    } else if (conditionIdToPreviewShow) {
      return trivialPartition(outcomeSlot).map((indexSet) => {
        return positionString([conditionIdToPreviewShow], [indexSet], amount, collateralToken)
      })
    } else {
      return []
    }
  }, [position, outcomeSlot, amount, collateralToken]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CenteredCard>
      <Row cols="1fr">
        <InputCondition formMethods={formMethods} onConditionChange={handleConditionChange} />
      </Row>
      <Row cols="1fr" marginBottomXL>
        <TitleValue
          title="Split From"
          value={
            <SplitFrom
              formMethods={formMethods}
              onCollateralChange={onCollateralChange}
              onPositionChange={(p) => setPosition(p)}
              splitFromCollateral={splitFromCollateral}
              splitFromPosition={splitFromPosition}
              tokens={tokens}
            />
          }
        />
      </Row>
      {shouldDisplayAllowance && (
        <SetAllowance
          collateral={collateralToken}
          fetching={fetchingAllowance}
          finished={allowanceFinished}
          onUnlock={unlockCollateral}
        />
      )}
      <Row cols="1fr" marginBottomXL>
        <InputAmount
          collateral={collateralToken}
          formMethods={formMethods}
          positionId={positionId}
          splitFrom={splitFrom}
        />
      </Row>
      <Row cols="1fr" marginBottomXL>
        <TitleValue
          title="Partition"
          titleControl={<TitleControl>Edit Partition</TitleControl>}
          value={<PartitionStyled collections={mockedNumberedOutcomes} />}
        />
      </Row>
      <Row cols="1fr" marginBottomXL>
        <TitleValue
          title="Split Position Preview"
          value={
            <StripedListStyled>
              {splitPositionPreview.map((preview, i) => (
                <StripedListItem key={`preview-${i}`}>{preview}</StripedListItem>
              ))}
            </StripedListStyled>
          }
        />
      </Row>
      {isTransactionExecuting && (
        <FullLoading
          actionButton={
            error ? { text: 'OK', onClick: () => setIsTransactionExecuting(true) } : undefined
          }
          icon={error ? IconTypes.error : IconTypes.spinner}
          message={error ? error.message : 'Waiting...'}
          title={error ? 'Error' : 'Split position'}
        />
      )}
      {error && (
        <ErrorContainer>
          <ErrorMessage>{error.message}</ErrorMessage>
        </ErrorContainer>
      )}
      <ButtonContainer>
        <Button disabled={!canSubmit} onClick={handleSubmit(onSubmit)}>
          Split
        </Button>
      </ButtonContainer>
    </CenteredCard>
  )
}
