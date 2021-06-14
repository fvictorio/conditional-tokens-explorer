/* eslint-disable react/display-name */
import React, { useCallback, useEffect, useState } from 'react'
import DataTable, { IDataTableStyles } from 'react-data-table-component'
import styled from 'styled-components'

import chart from 'chart.svg'
import { Button } from 'components/buttons/Button'
import { SearchField } from 'components/form/SearchField'
import { ChevronDown } from 'components/icons/ChevronDown'
import { IconPlus } from 'components/icons/IconPlus'
import { BaseCard } from 'components/pureStyledComponents/BaseCard'
import { InlineLoading } from 'components/statusInfo/InlineLoading'
import { GetCondition_landing, LandingConditionsCell } from 'components/table/LandingConditionsCell'
import { GetPosition_landing, LandingPositionsCell } from 'components/table/LandingPositionsCell'
import { LandingTableFooter } from 'components/table/LandingTableFooter'
import conditionsData from 'conditions-data.json'
import { useLandingSearchOptions } from 'hooks/useLandingSearchOptions'
import positionsData from 'positions-data.json'
import { customStyles } from 'theme/tableCustomStyles'
import { ConditionSearchOptions, LandingSearchOptions, PositionSearchOptions } from 'util/types'

const ConditionsFooter = () => <LandingTableFooter title="View All Conditions" />
const PositionsFooter = () => <LandingTableFooter title="View All Positions" />

const LandingTableStyles: IDataTableStyles = {
  ...customStyles,
  rows: {
    style: {
      minHeight: 'unset',
    },
  },
}

const LandingContainer = styled.div`
  max-width: 1300px;
  width: 100%;
  // height: 100vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  margin-top: 25px;
`

const LandingRow = styled.div`
  display: flex;
  justify-items: space-between;
  gap: 18px;
  width: 100%;
  margin-bottom: 25px;
`

const SearchFieldStyled = styled(SearchField)`
  max-width: unset;
  width: 100%;
`

const LandingCard = styled(BaseCard)`
  width: 50%;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 22px;
  padding: 18px;
`
const TotalsItem = styled.div`
  flex: 1 0 40%;
  padding-left: 10px;
  position: relative;
  // border-left: 5px solid #0092ab;

  &::after {
    content: '';
    position: absolute;
    left: -5px;
    top: 0;
    bottom: 0;
    width: 5px;
    background: #0092ab;
    border-radius: 3px;
  }
`

const TotalsItemTitle = styled.p`
  font-style: normal;
  font-weight: normal;
  font-size: 18px;
  line-height: 22px;
  color: #5d6d74;
  margin: 0 0 5px;
  padding: 0;
`

const TotalsItemValue = styled.p`
  font-style: normal;
  font-weight: 600;
  font-size: 22px;
  line-height: 27px;
  color: #445055;
  margin: 0;
  padding: 0;
`
const Chart = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`
const ChartHeader = styled.div`
  display: flex;
  flex direction: row;
  justify-content: space-between;
  margin-bottom: 18px;
`

const ChartTtile = styled.p`
  font-style: normal;
  font-weight: 600;
  font-size: 18px;
  line-height: 22px;
  margin: 0;
`

const ChartDropdown = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  line-height: 20px;
`

export const Landing: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false)
  // eslint-disable-next-line
  const [searchBy, setSearchBy] = useState<
    ConditionSearchOptions | PositionSearchOptions | LandingSearchOptions
  >(LandingSearchOptions.All)
  const [textToShow, setTextToShow] = useState<string>('')

  const dropdownItems = useLandingSearchOptions(setSearchBy)

  const onChangeSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget
    setTextToShow(value)
  }, [])

  const onClearSearch = useCallback(() => {
    setTextToShow('')
  }, [])

  const conditionsColumns = [
    {
      cell: (row: GetCondition_landing) => (
        <LandingConditionsCell
          conditionId={row.conditionId}
          createTimestamp={row.createTimestamp}
          oracle={row.oracle}
          question={row.question}
          resolved={row.resolved}
          totalLocked={row.totalLocked}
          userBalance={row.userBalance}
        />
      ),
      maxWidth: '100%',
      minWidth: '110px',
      name: 'Conditions',
    },
  ]

  useEffect(() => {
    setIsLoading(true)
    setInterval(() => {
      setIsLoading(false)
    }, 1500)
  }, [])

  const positionsColumns = [
    {
      cell: (row: GetPosition_landing) => (
        <LandingPositionsCell
          conditionId={row.conditionId}
          createTimestamp={row.createTimestamp}
          oracle={row.oracle}
          positionId={row.positionId}
          question={row.question}
          totalBalance={row.totalBalance}
        />
      ),
      maxWidth: '100%',
      minWidth: '110px',
      name: 'Positions',
    },
  ]

  return (
    <LandingContainer>
      <LandingRow style={{ alignItems: 'center' }}>
        <SearchFieldStyled
          disabled={isLoading}
          dropdownItems={dropdownItems}
          onChange={onChangeSearch}
          onClear={onClearSearch}
          value={textToShow}
        />
        <Button disabled={isLoading}>
          <IconPlus />
          &nbsp;New Condition
        </Button>
      </LandingRow>
      <LandingRow>
        <LandingCard>
          {isLoading ? (
            <InlineLoading />
          ) : (
            <>
              <TotalsItem>
                <TotalsItemTitle>Total Collateral Locked</TotalsItemTitle>
                <TotalsItemValue>$55,808,127</TotalsItemValue>
              </TotalsItem>
              <TotalsItem>
                <TotalsItemTitle>Total Conditions Created</TotalsItemTitle>
                <TotalsItemValue>999,000,000</TotalsItemValue>
              </TotalsItem>
              <TotalsItem>
                <TotalsItemTitle>Total Collateral Redeemed</TotalsItemTitle>
                <TotalsItemValue>$28,368,428</TotalsItemValue>
              </TotalsItem>
              <TotalsItem>
                <TotalsItemTitle>Total Positions Created</TotalsItemTitle>
                <TotalsItemValue>15,568,374</TotalsItemValue>
              </TotalsItem>
            </>
          )}
        </LandingCard>
        <LandingCard>
          {isLoading ? (
            <InlineLoading />
          ) : (
            <Chart>
              <ChartHeader>
                <ChartTtile>Transaction History</ChartTtile>
                <ChartDropdown>
                  7 days
                  <ChevronDown />
                </ChartDropdown>
              </ChartHeader>
              <img alt="chart" src={chart} width="100%" />
            </Chart>
          )}
        </LandingCard>
      </LandingRow>
      <LandingRow>
        <DataTable
          className="outerTableWrapper"
          columns={conditionsColumns}
          customStyles={LandingTableStyles}
          data={isLoading ? [] : conditionsData || []}
          fixedHeader
          fixedHeaderScrollHeight="550px"
          noDataComponent={isLoading && <InlineLoading />}
          noHeader
          pagination
          paginationComponent={ConditionsFooter}
        />
        <DataTable
          className="outerTableWrapper"
          columns={positionsColumns}
          customStyles={LandingTableStyles}
          data={isLoading ? [] : positionsData || []}
          fixedHeader
          fixedHeaderScrollHeight="550px"
          noDataComponent={isLoading && <InlineLoading />}
          noHeader
          pagination
          paginationComponent={PositionsFooter}
        />
      </LandingRow>
    </LandingContainer>
  )
}
