import React from 'react'
import styled from 'styled-components'

import { ButtonCopy } from 'components/buttons/ButtonCopy'
import { Time } from 'components/icons/Time'
import { Hash } from 'components/text/Hash'
import daiLogo from 'dai.svg'
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
  display: inline-flex;
  align-items: center;
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

export interface GetPosition_landing {
  __typename?: 'Position'
  createTimestamp: number
  positionId: string
  conditionId: string
  oracle: string
  question: string
  totalBalance: string
}

export const LandingPositionsCell = (props: GetPosition_landing) => {
  const { conditionId, createTimestamp, oracle, positionId, question, totalBalance } = props
  return (
    <CellWrapper>
      <CellColumn>
        <CellRow style={{ gap: '10px', height: '22px' }}>
          <Hash
            href={`/conditions/${positionId}`}
            truncateLeft={6}
            truncateRight={4}
            value={positionId}
          />
          <OracleLink>
            - {oracle}
            <ButtonCopy value={oracle} />
          </OracleLink>
          <Hash
            href={`/conditions/${conditionId}`}
            truncateLeft={6}
            truncateRight={4}
            value={conditionId}
          />
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
      <CellColumn>
        <AmountBlock>
          <AmountText>
            <img alt="dai-logo" src={daiLogo} />
            &nbsp;&nbsp;
            {totalBalance}
          </AmountText>
          <AmountLabel>Total Balance</AmountLabel>
        </AmountBlock>
      </CellColumn>
    </CellWrapper>
  )
}
