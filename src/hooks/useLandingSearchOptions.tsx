import { useEffect, useState } from 'react'

import { ConditionSearchOptions, LandingSearchOptions, PositionSearchOptions } from 'util/types'

export const useLandingSearchOptions = (
  itemAction: (
    searchFilter: ConditionSearchOptions | PositionSearchOptions | LandingSearchOptions
  ) => void
) => {
  const [items, setItems] = useState<
    Array<{ onClick: () => void; placeholder: string; text: string }>
  >()

  useEffect(() => {
    setItems([
      // TODO not remove this until the TEXT fields will be created in the subgraph. Thegraph doesnt't support OR operator
      {
        onClick: () => {
          itemAction(LandingSearchOptions.All)
        },
        placeholder:
          'Search by Condition Id, Question Id, Question Text, Oracle Address, Creator Address, Position Id, Collateral Symbol, Collateral Address, Token Address.',
        text: 'All',
      },
      {
        onClick: () => {
          itemAction(ConditionSearchOptions.ConditionId)
        },
        placeholder: 'Search by Condition Id',
        text: 'Condition Id',
      },
      {
        onClick: () => {
          itemAction(ConditionSearchOptions.QuestionId)
        },
        placeholder: 'Search by Question Id',
        text: 'Question Id',
      },
      {
        onClick: () => {
          itemAction(ConditionSearchOptions.QuestionText)
        },
        placeholder: 'Search by Question Text',
        text: 'Question Text',
      },
      {
        onClick: () => {
          itemAction(ConditionSearchOptions.OracleAddress)
        },
        placeholder: 'Search by Oracle Address',
        text: 'Oracle Address',
      },
      {
        onClick: () => {
          itemAction(ConditionSearchOptions.CreatorAddress)
        },
        placeholder: 'Search by Creator Address',
        text: 'Creator Address',
      },
      {
        onClick: () => {
          itemAction(PositionSearchOptions.PositionId)
        },
        placeholder: 'Search by Position Id',
        text: 'Position Id',
      },
      {
        onClick: () => {
          itemAction(PositionSearchOptions.CollateralSymbol)
        },
        placeholder: 'Search by Collateral Symbol',
        text: 'Collateral Symbol',
      },
      {
        onClick: () => {
          itemAction(PositionSearchOptions.CollateralAddress)
        },
        placeholder: 'Search by Collateral Address',
        text: 'Collateral Address',
      },
      {
        onClick: () => {
          itemAction(PositionSearchOptions.WrappedCollateralAddress)
        },
        placeholder: 'Search by Wrapped Collateral Address',
        text: 'Wrapped Collateral Address',
      },
    ])
  }, [itemAction])

  return items
}
