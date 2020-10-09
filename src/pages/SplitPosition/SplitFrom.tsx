import React, { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'

import { InputPosition, InputPositionProps } from 'components/form/InputPosition'
import { SelectCollateral, SelectCollateralProps } from 'components/form/SelectCollateral'
import { CustomCollateralModal } from 'components/modals/CustomCollateralModal'
import { SelectPositionModal } from 'components/modals/SelectPositionsModal'
import { TitleControl } from 'components/pureStyledComponents/TitleControl'
import { useBatchBalanceContext } from 'contexts/BatchBalanceContext'
import { useMultiPositionsContext } from 'contexts/MultiPositionsContext'
import { Position } from 'hooks'
import { LocationRouterState, SplitFromType, Token } from 'util/types'

const Controls = styled.div`
  margin-bottom: 8px;
  margin-top: -3px;

  @media (min-width: ${(props) => props.theme.themeBreakPoints.md}) {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }
`

const Tabs = styled.div`
  display: flex;
  align-items: center;
`

const Tab = styled.div`
  position: relative;
`

const TabText = styled.div<{ active: boolean }>`
  color: ${(props) => (props.active ? props.theme.colors.primary : props.theme.colors.mediumGrey)};
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  position: relative;
  text-align: left;
  text-transform: uppercase;
  z-index: 1;
`

const Radio = styled.input`
  cursor: pointer;
  height: 100%;
  opacity: 0;
  position: absolute;
  width: 100%;
  z-index: 123;
`

const Break = styled.div`
  background-color: ${(props) => props.theme.colors.mediumGrey};
  height: 14px;
  margin: 0 8px;
  width: 1px;
`

const ToggleableTitleControl = styled(TitleControl)<{ visible?: boolean }>`
  display: ${(props) => (props.visible ? 'block' : 'none')};
`

const ToggleableSelectCollateral = styled(SelectCollateral)<{ visible?: boolean }>`
  display: ${(props) => (props.visible ? 'block' : 'none')};
`

const ToggleableInputPosition = styled(InputPosition)<{ visible?: boolean }>`
  display: ${(props) => (props.visible ? 'block' : 'none')};
`

interface Props extends InputPositionProps, SelectCollateralProps {}

export const SplitFrom: React.FC<Props> = (props) => {
  const {
    cleanAllowanceError,
    formMethods,
    formMethods: { register, setValue },
    onPositionChange,
    splitFromCollateral,
    splitFromPosition,
    tokens,
  } = props

  const { updatePositionIds } = useMultiPositionsContext()
  const { updateBalances } = useBatchBalanceContext()
  const { state } = useLocation<LocationRouterState>()

  const [showCustomCollateralModal, setShowCustomCollateralModal] = useState(false)
  const [showSelectPositionModal, setShowSelectPositionModal] = useState(false)

  const openCustomCollateralModal = useCallback(() => setShowCustomCollateralModal(true), [])
  const closeCustomCollateralModal = useCallback(() => setShowCustomCollateralModal(false), [])

  const openSelectPositionModal = useCallback(() => setShowSelectPositionModal(true), [])
  const closeSelectPositionModal = useCallback(() => setShowSelectPositionModal(false), [])

  const onSelectPositionModalConfirm = React.useCallback(
    (positions: Array<Position>) => {
      const ids = positions.map((position) => position.id)
      updatePositionIds(ids)
      updateBalances(ids)
      closeSelectPositionModal()
    },
    [closeSelectPositionModal, updateBalances, updatePositionIds]
  )
  const [customToken, setCustomToken] = useState<Maybe<Token>>(null)

  useEffect(() => {
    if (customToken) {
      setValue('collateral', customToken.address, true)
    }
  }, [customToken, setValue])

  useEffect(() => {
    const locationRouterPosition = state?.positionid
    if (locationRouterPosition) {
      setValue('splitFrom', SplitFromType.position, false)
      updatePositionIds([locationRouterPosition])
      updateBalances([locationRouterPosition])
    }
  }, [updatePositionIds, updateBalances, setValue, state])

  return (
    <>
      <Controls>
        <Tabs>
          <Tab>
            <Radio name="splitFrom" ref={register} type="radio" value={SplitFromType.collateral} />
            <TabText active={splitFromCollateral}>Collateral</TabText>
          </Tab>
          <Break />
          <Tab>
            <Radio name="splitFrom" ref={register} type="radio" value={SplitFromType.position} />
            <TabText active={splitFromPosition}>Position</TabText>
          </Tab>
        </Tabs>
        <ToggleableTitleControl onClick={openCustomCollateralModal} visible={splitFromCollateral}>
          Add Custom Collateral
        </ToggleableTitleControl>
        <ToggleableTitleControl onClick={openSelectPositionModal} visible={splitFromPosition}>
          Select Position
        </ToggleableTitleControl>
      </Controls>
      <ToggleableSelectCollateral
        cleanAllowanceError={cleanAllowanceError}
        formMethods={formMethods}
        splitFromCollateral={splitFromCollateral}
        tokens={customToken ? [...tokens, customToken] : [...tokens]}
        visible={splitFromCollateral}
      />
      <ToggleableInputPosition
        clickHandler={openSelectPositionModal}
        formMethods={formMethods}
        onPositionChange={onPositionChange}
        splitFromPosition={splitFromPosition}
        visible={splitFromPosition}
      />
      {showCustomCollateralModal && (
        <CustomCollateralModal
          isOpen={showCustomCollateralModal}
          onAdd={setCustomToken}
          onRequestClose={closeCustomCollateralModal}
        />
      )}
      {showSelectPositionModal && (
        <SelectPositionModal
          isOpen={showSelectPositionModal}
          onConfirm={onSelectPositionModalConfirm}
          onRequestClose={closeSelectPositionModal}
          preSelectedPositions={[]}
          showOnlyPositionsWithBalance
          singlePosition
        />
      )}
    </>
  )
}
