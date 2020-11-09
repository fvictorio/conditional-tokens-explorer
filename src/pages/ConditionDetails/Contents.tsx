import React, { useCallback, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import { ButtonCopy } from 'components/buttons/ButtonCopy'
import { ButtonDropdownCircle } from 'components/buttons/ButtonDropdownCircle'
import { ButtonExpand } from 'components/buttons/ButtonExpand'
import { CenteredCard } from 'components/common/CenteredCard'
import {
  Dropdown,
  DropdownItemCSS,
  DropdownItemProps,
  DropdownPosition,
} from 'components/common/Dropdown'
import { DisplayTablePositions } from 'components/form/DisplayTablePositions'
import { DisplayHashesTableModal } from 'components/modals/DisplayHashesTableModal'
import { ExternalLink } from 'components/navigation/ExternalLink'
import { FlexRow } from 'components/pureStyledComponents/FlexRow'
import { Pill, PillTypes } from 'components/pureStyledComponents/Pill'
import { Row } from 'components/pureStyledComponents/Row'
import { StripedList, StripedListItem } from 'components/pureStyledComponents/StripedList'
import { FormatHash } from 'components/text/FormatHash'
import { TitleValue } from 'components/text/TitleValue'
import { INFORMATION_NOT_AVAILABLE, OMEN_URL_DAPP } from 'config/constants'
import { Web3ContextStatus, useWeb3ConnectedOrInfura } from 'contexts/Web3Context'
import { useIsConditionFromOmen } from 'hooks/useIsConditionFromOmen'
import { useLocalStorage } from 'hooks/useLocalStorageValue'
import { useOmenMarkets } from 'hooks/useOmenMarkets'
import { usePositions } from 'hooks/usePositions'
import { useQuestion } from 'hooks/useQuestion'
import { GetCondition_condition } from 'types/generatedGQLForCTE'
import {
  formatTS,
  getConditionTypeTitle,
  getOmenMarketURL,
  getRealityQuestionUrl,
  truncateStringInTheMiddle,
} from 'util/tools'
import { ConditionStatus, ConditionType, LocalStorageManagement } from 'util/types'

const StripedListStyled = styled(StripedList)`
  margin-top: 6px;
`

const DropdownItemLink = styled(NavLink)<DropdownItemProps>`
  ${DropdownItemCSS}
`

interface Props {
  condition: GetCondition_condition
}

export const Contents: React.FC<Props> = ({ condition }) => {
  const { _type: status, networkConfig } = useWeb3ConnectedOrInfura()

  const { setValue } = useLocalStorage(LocalStorageManagement.ConditionId)

  const {
    createTimestamp,
    creator,
    id: conditionId,
    oracle,
    outcomeSlotCount,
    payouts,
    questionId,
    resolveTimestamp,
    resolved,
  } = condition

  const {
    data: dataOmenMarkets,
    error: errorOmenMarkets,
    loading: loadingOmenMarkets,
  } = useOmenMarkets([conditionId])
  const [openOmenMarkets, setOpenOmenMarkets] = useState(false)

  const isConnected = useMemo(() => status === Web3ContextStatus.Connected, [status])
  const omenMarkets = useMemo(() => {
    if (
      !loadingOmenMarkets &&
      !errorOmenMarkets &&
      dataOmenMarkets?.condition?.fixedProductMarketMakers &&
      dataOmenMarkets?.condition?.fixedProductMarketMakers?.length > 0
    ) {
      return dataOmenMarkets.condition.fixedProductMarketMakers
    } else {
      return []
    }
  }, [dataOmenMarkets, errorOmenMarkets, loadingOmenMarkets])

  const areOmenMarketsMoreThanOne = useMemo(() => omenMarkets.length > 1, [omenMarkets])

  const dropdownItems = useMemo(() => {
    return [
      {
        href: `/split/`,
        onClick: () => {
          setValue(conditionId)
        },
        text: 'Split Position',
        disabled: !isConnected,
      },
      {
        href: `/merge/`,
        onClick: () => {
          setValue(conditionId)
        },
        text: 'Merge Positions',
        disabled: !isConnected,
      },
      {
        href: `/report/`,
        onClick: () => {
          setValue(conditionId)
        },
        text: 'Report Payouts',
        disabled: resolved || !isConnected,
      },
    ]
  }, [setValue, conditionId, resolved, isConnected])

  const { outcomesPrettier, question } = useQuestion(questionId, outcomeSlotCount)
  const isConditionFromOmen = useIsConditionFromOmen(oracle)
  const {
    templateId = null,
    title = INFORMATION_NOT_AVAILABLE,
    category = INFORMATION_NOT_AVAILABLE,
  } = question ?? {}

  const oracleName = useMemo(
    () =>
      isConditionFromOmen ? (
        networkConfig.getOracleFromAddress(oracle).description
      ) : (
        <FormatHash hash={truncateStringInTheMiddle(oracle, 8, 6)} />
      ),
    [networkConfig, oracle, isConditionFromOmen]
  )

  const { data: positions, loading: loadingPositions } = usePositions({
    conditionsIds: [conditionId],
  })

  const getRealityQuestionUrlMemoized = useCallback(
    (questionId: string): string => getRealityQuestionUrl(questionId, networkConfig),
    [networkConfig]
  )

  return (
    <CenteredCard
      dropdown={
        <Dropdown
          activeItemHighlight={false}
          dropdownButtonContent={<ButtonDropdownCircle />}
          dropdownPosition={DropdownPosition.right}
          items={dropdownItems.map((item, index) => (
            <DropdownItemLink
              disabled={item.disabled}
              key={index}
              onMouseDown={item.onClick}
              to={item.href}
            >
              {item.text}
            </DropdownItemLink>
          ))}
        />
      }
    >
      <Row marginBottomXL>
        <TitleValue
          title="Condition Id"
          value={
            <FlexRow>
              <FormatHash hash={truncateStringInTheMiddle(conditionId, 8, 6)} />
              <ButtonCopy value={conditionId} />
            </FlexRow>
          }
        />
        <TitleValue
          title="Condition Type"
          value={isConditionFromOmen ? ConditionType.omen : ConditionType.custom}
        />
        <TitleValue
          title="Status"
          value={
            <Pill type={resolved ? PillTypes.primary : PillTypes.open}>
              {resolved ? ConditionStatus.Resolved : ConditionStatus.Open}
            </Pill>
          }
        />
        <TitleValue title="Creation Date" value={formatTS(createTimestamp)} />
        <TitleValue
          title="Creator Address"
          value={
            <FlexRow>
              <FormatHash hash={truncateStringInTheMiddle(creator, 8, 6)} />
              <ButtonCopy value={creator} />
            </FlexRow>
          }
        />
        {isConditionFromOmen && (
          <TitleValue title="Question Type" value={getConditionTypeTitle(templateId)} />
        )}
        <TitleValue
          title="Question Id"
          value={
            <FlexRow>
              <FormatHash hash={truncateStringInTheMiddle(questionId, 8, 6)} />
              <ButtonCopy value={questionId} />
            </FlexRow>
          }
        />
      </Row>
      {isConditionFromOmen && (
        <>
          <Row cols="1fr" marginBottomXL>
            <TitleValue title="Question" value={title} />
          </Row>
          <Row cols="1fr" marginBottomXL>
            <TitleValue
              title="Outcomes"
              value={
                <StripedListStyled>
                  {outcomesPrettier.map((outcome: string, index: number) => (
                    <StripedListItem key={index}>
                      {resolved && payouts ? `${outcome} - ${payouts[index]}%` : outcome}
                    </StripedListItem>
                  ))}
                </StripedListStyled>
              }
            />
          </Row>
        </>
      )}
      <Row>
        {isConditionFromOmen && resolved && (
          <TitleValue title="Resolution Date" value={formatTS(resolveTimestamp)} />
        )}
        {isConditionFromOmen && <TitleValue title="Category" value={category} />}
        <TitleValue
          title={isConditionFromOmen ? 'Oracle' : 'Reporting Address'}
          value={
            <FlexRow>
              {oracleName}
              <ButtonCopy value={oracle} />
              {isConditionFromOmen && (
                <ExternalLink href={getRealityQuestionUrlMemoized(questionId)} />
              )}
            </FlexRow>
          }
        />
      </Row>
      {omenMarkets.length > 0 && (
        <Row>
          <TitleValue
            title={areOmenMarketsMoreThanOne ? 'Omen Markets' : 'Omen Market'}
            value={
              <FlexRow>
                {omenMarkets[0].question ? omenMarkets[0].question.title : omenMarkets[0].id}
                {!areOmenMarketsMoreThanOne && <ButtonCopy value={omenMarkets[0].id} /> && (
                  <ExternalLink href={getOmenMarketURL(omenMarkets[0].id)} />
                )}
                {areOmenMarketsMoreThanOne && (
                  <ButtonExpand onClick={() => setOpenOmenMarkets(true)} />
                )}
              </FlexRow>
            }
          />
        </Row>
      )}
      <Row cols="1fr">
        <TitleValue
          title={"Condition's split positions"}
          value={<DisplayTablePositions isLoading={loadingPositions} positions={positions || []} />}
        />
      </Row>

      {openOmenMarkets && omenMarkets.length > 0 && (
        <DisplayHashesTableModal
          hashes={omenMarkets.map(({ id }) => {
            return { hash: id }
          })}
          isOpen={openOmenMarkets}
          onRequestClose={() => setOpenOmenMarkets(false)}
          title="Omen Markets"
          titleTable="Market Name"
          url={OMEN_URL_DAPP}
        />
      )}
    </CenteredCard>
  )
}
