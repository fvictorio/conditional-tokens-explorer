import React, { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import { ButtonCopy } from 'components/buttons/ButtonCopy'
import { ButtonDropdownCircle } from 'components/buttons/ButtonDropdownCircle'
import { CenteredCard } from 'components/common/CenteredCard'
import { Dropdown, DropdownItemCSS, DropdownPosition } from 'components/common/Dropdown'
import { DisplayTablePositions } from 'components/form/DisplayTablePositions'
import { FlexRow } from 'components/pureStyledComponents/FlexRow'
import { Pill, PillTypes } from 'components/pureStyledComponents/Pill'
import { Row } from 'components/pureStyledComponents/Row'
import { StripedList, StripedListItem } from 'components/pureStyledComponents/StripedList'
import { FormatHash } from 'components/text/FormatHash'
import { TitleValue } from 'components/text/TitleValue'
import { INFORMATION_NOT_AVAILABLE } from 'config/constants'
import { useWeb3ConnectedOrInfura } from 'contexts/Web3Context'
import { useIsConditionFromOmen } from 'hooks/useIsConditionFromOmen'
import { usePositions } from 'hooks/usePositions'
import { useQuestion } from 'hooks/useQuestion'
import { GetCondition_condition } from 'types/generatedGQLForCTE'
import { formatTS, getConditionTypeTitle, truncateStringInTheMiddle } from 'util/tools'
import { ConditionStatus, ConditionType } from 'util/types'

const StripedListStyled = styled(StripedList)`
  margin-top: 6px;
`

const DropdownItemLink = styled(NavLink)<{ isItemActive?: boolean }>`
  ${DropdownItemCSS}
`

interface Props {
  condition: GetCondition_condition
}

export const Contents: React.FC<Props> = ({ condition }) => {
  const { networkConfig } = useWeb3ConnectedOrInfura()

  const {
    creator,
    id: conditionId,
    oracle,
    outcomeSlotCount,
    questionId,
    resolveTimestamp,
    resolved,
  } = condition

  const dropdownItems = useMemo(() => {
    return [
      {
        href: `/split/`,
        id: conditionId,
        onClick: undefined,
        text: 'Split Position',
      },
      {
        href: `/merge/`,
        id: conditionId,
        onClick: undefined,
        text: 'Merge Positions',
      },
      {
        href: `/report/`,
        id: conditionId,
        onClick: undefined,
        text: 'Report Payouts',
      },
    ]
  }, [conditionId])

  const { outcomesPrettier, question } = useQuestion(questionId, outcomeSlotCount)
  const isConditionFromOmen = useIsConditionFromOmen(creator, oracle, question)
  const {
    templateId = null,
    title = INFORMATION_NOT_AVAILABLE,
    category = INFORMATION_NOT_AVAILABLE,
  } = question ?? {}

  const oracleTitle = isConditionFromOmen ? (
    networkConfig.getOracleFromAddress(oracle).description
  ) : (
    <FormatHash hash={truncateStringInTheMiddle(oracle, 8, 6)} />
  )
  const { data: positions, loading: loadingPositions } = usePositions({
    conditionsIds: [conditionId],
  })

  return (
    <CenteredCard
      dropdown={
        <Dropdown
          activeItemHighlight={false}
          dropdownButtonContent={<ButtonDropdownCircle />}
          dropdownPosition={DropdownPosition.right}
          items={dropdownItems.map((item, index) => (
            <DropdownItemLink
              key={index}
              onMouseDown={item.onClick}
              to={{ pathname: item.href, state: { conditionid: item.id } }}
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
                    <StripedListItem key={index}>{outcome}</StripedListItem>
                  ))}
                </StripedListStyled>
              }
            />
          </Row>
        </>
      )}
      <Row>
        {isConditionFromOmen && (
          <TitleValue
            title="Resolution Date"
            value={formatTS(resolveTimestamp) || INFORMATION_NOT_AVAILABLE}
          />
        )}
        {isConditionFromOmen && <TitleValue title="Category" value={category} />}
        <TitleValue
          title={isConditionFromOmen ? 'Oracle' : 'Reporting Address'}
          value={
            <FlexRow>
              {oracleTitle}
              <ButtonCopy value={oracle} />
            </FlexRow>
          }
        />
      </Row>
      <Row cols="1fr">
        <TitleValue
          title={"Condition's split positions"}
          value={<DisplayTablePositions isLoading={loadingPositions} positions={positions || []} />}
        />
      </Row>
    </CenteredCard>
  )
}
