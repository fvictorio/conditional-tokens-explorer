import React from 'react'
import styled from 'styled-components'

import { ButtonCopy } from 'components/buttons/ButtonCopy'
import { Time } from 'components/icons/Time'
import { Pill, PillTypes } from 'components/pureStyledComponents/Pill'
import { Hash } from 'components/text/Hash'
import { formatTSAlt } from 'util/tools'

const CellWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-content: stretch;
  width: 100%;
  gap: 18px;
  padding: 10px 0;
`

const CellColumn = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
`

const CellRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  // gap: 10px;
`

const OracleLink = styled.div`
  align-items: center;
  display: inline-flex;
  flex-wrap: nowrap;
  white-space: nowrap;
  color: #009cb4;
`

const TimeText = styled.p`
  font-style: normal;
  font-weight: normal;
  font-size: 12px;
  color: #9d9d9d;
  margin: 0;
  margin-left: 4px;
`
const AmountBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  & p {
    margin: 0;
  }
`

const AmountText = styled.p`
  font-style: normal;
  font-weight: 600;
  font-size: 15px;
  // line-height: 19px;
  color: #445055;
`

const AmountLabel = styled.p`
  font-style: normal;
  font-weight: 600;
  font-size: 11px;
  // line-height: 14px;
  color: #9d9d9d;
`

export interface GetCondition_landing {
  __typename?: 'Condition'
  createTimestamp: number
  conditionId: string
  oracle: string
  question: string
  resolved: boolean
  totalLocked: string
  userBalance: string
}

export const LandingConditionsCell = (props: GetCondition_landing) => {
  const {
    conditionId,
    createTimestamp,
    oracle,
    question,
    resolved,
    totalLocked,
    userBalance,
  } = props
  return (
    <CellWrapper>
      <CellColumn>
        <CellRow>
          <Hash href={`/conditions/${conditionId}`} value={conditionId} />
          <OracleLink style={{ marginLeft: '10px' }}>
            - {oracle}
            <ButtonCopy value={oracle} />
          </OracleLink>
          {resolved ? (
            <Pill onClick={() => null} style={{ marginLeft: '10px' }} type={PillTypes.primary}>
              Resolved
            </Pill>
          ) : (
            <Pill onClick={() => null} style={{ marginLeft: '10px' }} type={PillTypes.open}>
              Open
            </Pill>
          )}
        </CellRow>
        <CellRow style={{ color: '#9D9D9D' }}>
          Q: {question}
          <ButtonCopy value={question} />
        </CellRow>
        <CellRow>
          <Time />
          <TimeText>{formatTSAlt(createTimestamp)}</TimeText>
        </CellRow>
      </CellColumn>
      <CellColumn style={{ gap: '4px' }}>
        {totalLocked && (
          <AmountBlock>
            <AmountText>{totalLocked}</AmountText>
            <AmountLabel>Total USD locked</AmountLabel>
          </AmountBlock>
        )}
        {userBalance && (
          <AmountBlock>
            <AmountText>{userBalance}</AmountText>
            <AmountLabel>User balance</AmountLabel>
          </AmountBlock>
        )}
      </CellColumn>
    </CellWrapper>
  )
}
