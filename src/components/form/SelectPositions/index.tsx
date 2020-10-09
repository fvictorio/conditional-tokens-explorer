import { BigNumber } from 'ethers/utils'
import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

import { ButtonControl, ButtonControlType } from 'components/buttons/ButtonControl'
import { TextfieldFetchableData } from 'components/form/TextfieldFetchableData'
import { SelectPositionModal } from 'components/modals/SelectPositionsModal'
import { Error, ErrorContainer } from 'components/pureStyledComponents/Error'
import {
  StripedList,
  StripedListEmpty,
  StripedListItem,
} from 'components/pureStyledComponents/StripedList'
import { TitleControl } from 'components/pureStyledComponents/TitleControl'
import { InlineLoading } from 'components/statusInfo/InlineLoading'
import { TitleValue } from 'components/text/TitleValue'
import { useBatchBalanceContext } from 'contexts/BatchBalanceContext'
import { useMultiPositionsContext } from 'contexts/MultiPositionsContext'
import { useWeb3ConnectedOrInfura } from 'contexts/Web3Context'
import { Position } from 'hooks'
import { useWithToken } from 'hooks/useWithToken'
import isEqual from 'lodash.isequal'
import { GetMultiPositions_positions } from 'types/generatedGQLForCTE'
import { positionString } from 'util/tools'
import { Errors, LocationRouterState } from 'util/types'

const PositionText = styled.span`
  max-width: calc(100% - 30px);
`

interface Props {
  title: string
  singlePosition?: boolean
  showOnlyPositionsWithBalance?: boolean
  callbackToBeExecutedOnRemoveAction?: () => void
}

const isDataInSync = (
  positionsLoading: boolean,
  balancesLoading: boolean,
  positions: GetMultiPositions_positions[],
  balances: BigNumber[],
  positionsIds: string[]
) => {
  return (
    !positionsLoading &&
    !balancesLoading &&
    positions.length &&
    balances.length &&
    balances.length === positions.length &&
    isEqual(
      positionsIds,
      positions.map((p) => p.id)
    )
  )
}

export const SelectPositions = ({
  callbackToBeExecutedOnRemoveAction,
  showOnlyPositionsWithBalance,
  singlePosition,
  title,
}: Props) => {
  const { networkConfig } = useWeb3ConnectedOrInfura()
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const {
    errors: positionsErrors,
    loading: positionsLoading,
    positionIds,
    positions,
    updatePositionIds,
  } = useMultiPositionsContext()
  const { data: positionsWithToken } = useWithToken(positions)

  const {
    balances,
    errors: balancesErrors,
    loading: balancesLoading,
    updateBalances,
  } = useBatchBalanceContext()

  const { state } = useLocation<LocationRouterState>()

  useEffect(() => {
    const locationRouterPosition = state?.positionid
    if (locationRouterPosition) {
      updatePositionIds([locationRouterPosition])
      updateBalances([locationRouterPosition])
    }
  }, [updatePositionIds, updateBalances, state])

  const [positionsToDisplay, setPositionsToDisplay] = React.useState<Array<string>>([])

  const closeModal = React.useCallback(() => setIsModalOpen(false), [])
  const openModal = React.useCallback(() => setIsModalOpen(true), [])

  const onModalConfirm = React.useCallback(
    (positions: Array<Position>) => {
      const ids = positions.map((position) => position.id)
      updatePositionIds(ids)
      updateBalances(ids)
      closeModal()
    },
    [closeModal, updateBalances, updatePositionIds]
  )

  const onRemovePosition = React.useCallback(
    (positionId: string) => {
      if (
        callbackToBeExecutedOnRemoveAction &&
        typeof callbackToBeExecutedOnRemoveAction === 'function'
      ) {
        callbackToBeExecutedOnRemoveAction()
      }
      const ids = positionIds.filter((id) => id !== positionId)
      updatePositionIds(ids)
      updateBalances(ids)
    },
    [positionIds, updateBalances, updatePositionIds, callbackToBeExecutedOnRemoveAction]
  )

  React.useEffect(() => {
    if (positionIds.length > 0) {
      if (
        isDataInSync(positionsLoading, balancesLoading, positionsWithToken, balances, positionIds)
      ) {
        setPositionsToDisplay(
          positionsWithToken.map((position) => {
            const i = positionIds.findIndex((id) => id === position.id)

            return positionString(
              position.conditionIds,
              position.indexSets,
              balances[i],
              position.token
            )
          })
        )
      }
    } else {
      setPositionsToDisplay([])
    }
  }, [
    balances,
    networkConfig,
    positions,
    positionsLoading,
    balancesLoading,
    positionIds,
    positionsWithToken,
  ])

  const isLoading = React.useMemo(() => {
    return (
      positionsLoading ||
      balancesLoading ||
      (positionsToDisplay.length === 0 && positionIds.length !== 0)
    )
  }, [positionsLoading, balancesLoading, positionsToDisplay, positionIds])

  const errors = React.useMemo(() => [...positionsErrors, ...balancesErrors], [
    positionsErrors,
    balancesErrors,
  ])

  return (
    <>
      <TitleValue
        title={title}
        titleControl={
          <TitleControl onClick={openModal}>
            {singlePosition ? 'Select Position' : 'Select Positions'}
          </TitleControl>
        }
        value={
          <>
            {singlePosition ? (
              <TextfieldFetchableData
                error={!!errors.length}
                isFetching={isLoading || balancesLoading}
                onClick={() => setIsModalOpen(true)}
                placeholder={'Please select a position...'}
                readOnly
                type="text"
                value={positionsToDisplay.length ? positionsToDisplay[0] : ''}
              />
            ) : (
              <StripedList maxHeight="300px" minHeight="90px">
                {positionsToDisplay.length ? (
                  positionsToDisplay.map((position: string, index: number) => (
                    <StripedListItem key={index}>
                      <PositionText>{position}</PositionText>
                      <ButtonControl
                        buttonType={ButtonControlType.delete}
                        onClick={() => onRemovePosition(positions[index].id)}
                      />
                    </StripedListItem>
                  ))
                ) : (
                  <StripedListEmpty>
                    {isLoading && errors.length === 0 ? (
                      <InlineLoading size="30px" />
                    ) : (
                      'No positions.'
                    )}
                  </StripedListEmpty>
                )}
              </StripedList>
            )}
            {!!errors && (
              <ErrorContainer>
                {errors.map((error: Errors, index: number) => (
                  <Error key={index}>{error}</Error>
                ))}
              </ErrorContainer>
            )}
          </>
        }
      />
      {isModalOpen && (
        <SelectPositionModal
          isOpen={isModalOpen}
          onConfirm={onModalConfirm}
          onRequestClose={closeModal}
          preSelectedPositions={positionIds}
          showOnlyPositionsWithBalance={showOnlyPositionsWithBalance}
          singlePosition={singlePosition}
        />
      )}
    </>
  )
}
