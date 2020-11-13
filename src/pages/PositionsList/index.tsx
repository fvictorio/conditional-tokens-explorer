import { useDebounceCallback } from '@react-hook/debounce'
import { BigNumber } from 'ethers/utils'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import DataTable from 'react-data-table-component'
import { NavLink, useHistory } from 'react-router-dom'
import styled from 'styled-components'

import { ButtonCopy } from 'components/buttons/ButtonCopy'
import { ButtonDots } from 'components/buttons/ButtonDots'
import { ButtonExpand } from 'components/buttons/ButtonExpand'
import { ButtonType } from 'components/buttons/buttonStylingTypes'
import {
  Dropdown,
  DropdownItem,
  DropdownItemCSS,
  DropdownItemProps,
  DropdownPosition,
} from 'components/common/Dropdown'
import { TokenIcon } from 'components/common/TokenIcon'
import { CollateralFilterDropdown } from 'components/filters/CollateralFilterDropdown'
import { DateFilter } from 'components/filters/DateFilter'
import { WrappedCollateralFilterDropdown } from 'components/filters/WrappedCollateralFilterDropdown'
import { SearchField } from 'components/form/SearchField'
import { Switch } from 'components/form/Switch'
import { DisplayHashesTableModal } from 'components/modals/DisplayHashesTableModal'
import { TransferOutcomeTokensModal } from 'components/modals/TransferOutcomeTokensModal'
import { UnwrapModal } from 'components/modals/UnwrapModal'
import { WrapModal } from 'components/modals/WrapModal'
import { ExternalLink } from 'components/navigation/ExternalLink'
import { EmptyContentText } from 'components/pureStyledComponents/EmptyContentText'
import {
  FilterResultsControl,
  FilterResultsText,
} from 'components/pureStyledComponents/FilterResultsText'
import { FiltersSwitchWrapper } from 'components/pureStyledComponents/FiltersSwitchWrapper'
import { PageTitle } from 'components/pureStyledComponents/PageTitle'
import { Sidebar } from 'components/pureStyledComponents/Sidebar'
import { SidebarRow } from 'components/pureStyledComponents/SidebarRow'
import { TwoColumnsCollapsibleLayout } from 'components/pureStyledComponents/TwoColumnsCollapsibleLayout'
import { FullLoading } from 'components/statusInfo/FullLoading'
import { InfoCard } from 'components/statusInfo/InfoCard'
import { InlineLoading } from 'components/statusInfo/InlineLoading'
import { IconTypes } from 'components/statusInfo/common'
import { TableControls } from 'components/table/TableControls'
import { Hash } from 'components/text/Hash'
import { Web3ContextStatus, useWeb3ConnectedOrInfura } from 'contexts/Web3Context'
import { useLocalStorage } from 'hooks/useLocalStorageValue'
import { PositionWithUserBalanceWithDecimals, usePositionsList } from 'hooks/usePositionsList'
import { usePositionsSearchOptions } from 'hooks/usePositionsSearchOptions'
import { ConditionInformation } from 'hooks/utils'
import { customStyles } from 'theme/tableCustomStyles'
import { getLogger } from 'util/logger'
import { Remote } from 'util/remoteData'
import { formatTSSimple, getRealityQuestionUrl, isOracleRealitio } from 'util/tools'
import {
  AdvancedFilterPosition,
  CollateralFilterOptions,
  HashArray,
  LocalStorageManagement,
  PositionSearchOptions,
  Token,
  TransferOptions,
  WrappedCollateralOptions,
} from 'util/types'

const DropdownItemLink = styled(NavLink)<DropdownItemProps>`
  ${DropdownItemCSS}
`

const ButtonExpandStyled = styled(ButtonExpand)`
  margin-right: auto;
`

const logger = getLogger('PositionsList')

export const PositionsList = () => {
  const {
    _type: status,
    CTService,
    WrapperService,
    connect,
    networkConfig,
    signer,
  } = useWeb3ConnectedOrInfura()
  const history = useHistory()
  const { setValue } = useLocalStorage(LocalStorageManagement.PositionId)

  const [textToSearch, setTextToSearch] = useState<string>('')
  const [textToShow, setTextToShow] = useState<string>('')
  const [resetPagination, setResetPagination] = useState<boolean>(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [connectedItems, setConnectedItems] = useState<Array<any>>([])
  const [selectedCollateralFilter, setSelectedCollateralFilter] = useState<Maybe<string[]>>(null)
  const [selectedCollateralValue, setSelectedCollateralValue] = useState<string>(
    CollateralFilterOptions.All
  )
  const [selectedFromCreationDate, setSelectedFromCreationDate] = useState<Maybe<number>>(null)
  const [selectedToCreationDate, setSelectedToCreationDate] = useState<Maybe<number>>(null)
  const [wrappedCollateral, setWrappedCollateral] = useState<WrappedCollateralOptions>(
    WrappedCollateralOptions.All
  )
  const [isTransferOutcomeModalOpen, setIsTransferOutcomeModalOpen] = useState(false)
  const [selectedPositionId, setSelectedPositionId] = useState<string>('')
  const [selectedCollateralToken, setSelectedCollateralToken] = useState<Maybe<Token>>(null)
  const [transfer, setTransfer] = useState<Remote<TransferOptions>>(
    Remote.notAsked<TransferOptions>()
  )
  const [transactionTitle, setTransactionTitle] = useState<string>('')
  const [isWrapModalOpen, setIsWrapModalOpen] = useState(false)
  const [isUnwrapModalOpen, setIsUnwrapModalOpen] = useState(false)
  const [userBalance, setUserBalance] = useState(new BigNumber(0))

  const [searchBy, setSearchBy] = useState<PositionSearchOptions>(PositionSearchOptions.PositionId)
  const [showFilters, setShowFilters] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)

  const [openDisplayHashesTableModal, setOpenDisplayHashesTableModal] = useState(false)
  const [hashesTableModal, setHashesTableModal] = useState<Array<HashArray>>([])
  const [titleTableModal, setTitleTableModal] = useState('')
  const [urlTableModal, setUrlTableModal] = useState('')
  const [titleModal, setTitleModal] = useState('')

  const debouncedHandlerTextToSearch = useDebounceCallback((textToSearch) => {
    setTextToSearch(textToSearch)
  }, 500)

  const onChangeSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = event.currentTarget
      setTextToShow(value)
      debouncedHandlerTextToSearch(value)
    },
    [debouncedHandlerTextToSearch]
  )

  // Clear the filters on network change
  useEffect(() => {
    setShowFilters(false)
  }, [networkConfig])

  const resetFilters = useCallback(() => {
    setResetPagination(!resetPagination)
    setSelectedToCreationDate(null)
    setSelectedFromCreationDate(null)
    setSelectedCollateralFilter(null)
    setSelectedCollateralValue(CollateralFilterOptions.All)
    setWrappedCollateral(WrappedCollateralOptions.All)
  }, [resetPagination])

  useEffect(() => {
    setIsFiltering(
      selectedToCreationDate !== null ||
        selectedFromCreationDate !== null ||
        wrappedCollateral !== WrappedCollateralOptions.All ||
        selectedCollateralValue !== CollateralFilterOptions.All ||
        wrappedCollateral !== WrappedCollateralOptions.All ||
        selectedCollateralFilter !== null
    )
  }, [
    isFiltering,
    selectedCollateralFilter,
    selectedCollateralValue,
    selectedFromCreationDate,
    selectedToCreationDate,
    wrappedCollateral,
  ])

  const advancedFilters: AdvancedFilterPosition = useMemo(() => {
    return {
      CollateralValue: {
        type: selectedCollateralValue,
        value: selectedCollateralFilter,
      },
      ToCreationDate: selectedToCreationDate,
      FromCreationDate: selectedFromCreationDate,
      TextToSearch: {
        type: searchBy,
        value: textToSearch,
      },
      WrappedCollateral: wrappedCollateral,
    }
  }, [
    wrappedCollateral,
    selectedCollateralValue,
    selectedCollateralFilter,
    selectedToCreationDate,
    selectedFromCreationDate,
    searchBy,
    textToSearch,
  ])

  const onClearSearch = useCallback(() => {
    setTextToShow('')
    debouncedHandlerTextToSearch('')
  }, [debouncedHandlerTextToSearch])

  const { data, error, loading, refetchPositions, refetchUserPositions } = usePositionsList(
    advancedFilters
  )

  const isLoading = useMemo(() => !textToSearch && loading && transfer.isNotAsked(), [
    textToSearch,
    loading,
    transfer,
  ])

  const isSearching = useMemo(() => textToSearch && loading, [textToSearch, loading])

  const isConnected = useMemo(() => status === Web3ContextStatus.Connected, [status])
  const isSigner = useMemo(() => signer !== null, [signer])

  const buildMenuForRow = useCallback(
    (row: PositionWithUserBalanceWithDecimals) => {
      const { collateralTokenERC1155, id, userBalanceERC20, userBalanceERC1155 } = row
      const userHasERC1155Balance = userBalanceERC1155 && !userBalanceERC1155.isZero()
      const userHasERC20Balance = userBalanceERC20 && !userBalanceERC20.isZero()

      const menu = [
        {
          href: `/positions/${id}`,
          onClick: undefined,
          text: 'Details',
        },
        {
          disabled: !userHasERC1155Balance || !isConnected,
          href: `/redeem`,
          text: 'Redeem',
          onClick: () => {
            setValue(id)
          },
        },
        {
          disabled: !userHasERC1155Balance || !isConnected,
          href: `/split`,
          onClick: () => {
            setValue(id)
          },
          text: 'Split',
        },
        {
          disabled: !userHasERC1155Balance || !isConnected || !isSigner,
          href: undefined,
          text: 'Transfer Outcome Tokens',
          onClick: () => {
            setSelectedPositionId(id)
            setSelectedCollateralToken(collateralTokenERC1155)
            setIsTransferOutcomeModalOpen(true)
          },
        },
        {
          disabled: !userHasERC1155Balance || !isConnected || !isSigner,
          href: undefined,
          text: 'Wrap ERC1155',
          onClick: () => {
            setSelectedPositionId(id)
            setSelectedCollateralToken(collateralTokenERC1155)
            setUserBalance(userBalanceERC1155)
            setIsWrapModalOpen(true)
          },
        },
        {
          disabled: !userHasERC20Balance || !isConnected || !isSigner,
          href: undefined,
          text: 'Unwrap ERC20',
          onClick: () => {
            setSelectedPositionId(id)
            // Must send the original token, not the ERC20
            setSelectedCollateralToken(collateralTokenERC1155)
            setUserBalance(userBalanceERC20)
            setIsUnwrapModalOpen(true)
          },
        },
      ]

      return menu
    },
    [setValue, isConnected, isSigner]
  )

  const handleRowClick = useCallback(
    (row: PositionWithUserBalanceWithDecimals) => {
      history.push(`/positions/${row.id}`)
    },
    [history]
  )

  const menu = useMemo(() => {
    return [
      {
        // eslint-disable-next-line react/display-name
        cell: (row: PositionWithUserBalanceWithDecimals) => (
          <Dropdown
            activeItemHighlight={false}
            dropdownButtonContent={<ButtonDots />}
            dropdownPosition={DropdownPosition.right}
            items={buildMenuForRow(row).map((item, index) => {
              if (item.href) {
                return (
                  <DropdownItemLink
                    disabled={item.disabled}
                    onMouseDown={item.onClick}
                    to={item.href}
                  >
                    {item.text}
                  </DropdownItemLink>
                )
              } else {
                return (
                  <DropdownItem disabled={item.disabled} key={index} onClick={item.onClick}>
                    {item.text}
                  </DropdownItem>
                )
              }
            })}
          />
        ),
        name: '',
        width: '60px',
        right: true,
      },
    ]
  }, [buildMenuForRow])

  useEffect(() => {
    setConnectedItems([
      {
        // eslint-disable-next-line react/display-name
        cell: (row: PositionWithUserBalanceWithDecimals) => (
          <span
            onClick={() => handleRowClick(row)}
            title={
              isConnected
                ? row.userBalanceERC1155.toString()
                : 'Connect to your wallet to access these values.'
            }
          >
            {isConnected ? row.userBalanceERC1155WithDecimals : '-'}
          </span>
        ),
        name: 'ERC1155 Amount',
        right: true,
        selector: 'userBalanceERC1155Numbered',
        sortable: true,
      },
      {
        // eslint-disable-next-line react/display-name
        cell: (row: PositionWithUserBalanceWithDecimals) => (
          <span
            onClick={() => handleRowClick(row)}
            title={
              isConnected
                ? row.userBalanceERC20.toString()
                : 'Connect to your wallet to access these values.'
            }
          >
            {isConnected ? row.userBalanceERC20WithDecimals : '-'}
          </span>
        ),
        name: 'ERC20 Amount',
        right: true,
        selector: 'userBalanceERC20Numbered',
        sortable: true,
      },
    ])
  }, [status, handleRowClick, isConnected])

  const getColumns = useCallback(() => {
    // If you move this outside of the useCallback, can cause performance issues as a dep of this useCallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const defaultColumns: Array<any> = [
      {
        // eslint-disable-next-line react/display-name
        cell: (row: PositionWithUserBalanceWithDecimals) => (
          <Hash href={`/positions/${row.id}`} value={row.id} />
        ),
        name: 'Position Id',
        sortable: false,
        minWidth: '250px',
      },
      {
        // eslint-disable-next-line react/display-name
        cell: (row: PositionWithUserBalanceWithDecimals) => {
          const { collateralToken, collateralTokenERC1155 } = row
          // Please don't delete this because the tests will explode
          return collateralTokenERC1155 ? (
            <TokenIcon onClick={() => handleRowClick(row)} token={collateralTokenERC1155} />
          ) : (
            collateralToken
          )
        },
        name: 'Collateral',
        selector: 'collateralTokenSymbol',
        sortable: true,
      },
      {
        // eslint-disable-next-line react/display-name
        cell: (row: PositionWithUserBalanceWithDecimals) => formatTSSimple(row.createTimestamp),
        name: 'Creation Date',
        right: true,
        selector: 'createTimestamp',
        sortable: true,
      },
      {
        // eslint-disable-next-line react/display-name
        cell: (row: PositionWithUserBalanceWithDecimals) => {
          const { conditions } = row
          const conditionId = conditions[0]?.conditionId ?? ''
          if (conditions.length === 1) {
            return <Hash href={`/conditions/${conditionId}`} value={conditionId} />
          } else {
            return (
              <>
                <Hash href={`/conditions/${conditionId}`} value={conditionId} />
                <ButtonExpandStyled
                  onClick={() => {
                    const hashes: HashArray[] = conditions.map(
                      (condition: ConditionInformation) => {
                        return {
                          hash: condition.conditionId,
                        }
                      }
                    )
                    setOpenDisplayHashesTableModal(true)
                    setHashesTableModal(hashes)
                    setTitleTableModal('Condition Id')
                    setTitleModal('Conditions')
                    setUrlTableModal('conditions')
                  }}
                />
              </>
            )
          }
        },
        name: 'Condition Id',
        sortable: false,
        minWidth: '350px',
      },
      {
        // eslint-disable-next-line react/display-name
        cell: (row: PositionWithUserBalanceWithDecimals) => {
          const { conditions } = row
          const oracle = conditions[0]?.oracle ?? ''
          const questionId = conditions[0]?.questionId ?? ''

          const allOraclesAreEqual = conditions.every(
            (condition: ConditionInformation) =>
              condition.oracle.toLowerCase() === oracle.toLowerCase()
          )

          const isConditionFromOmen = isOracleRealitio(oracle, networkConfig)

          const oracleName = isConditionFromOmen ? (
            <>
              {networkConfig.getOracleFromAddress(oracle).description}
              <ButtonCopy value={oracle} />
              <ExternalLink href={getRealityQuestionUrl(questionId, networkConfig)} />
            </>
          ) : (
            <Hash value={oracle} />
          )

          if (conditions.length === 1 || allOraclesAreEqual) {
            return oracleName
          } else {
            return (
              <>
                {oracleName}
                <ButtonExpandStyled
                  onClick={() => {
                    const hashes: HashArray[] = conditions.map(
                      (condition: ConditionInformation) => {
                        return {
                          hash: condition.oracle,
                        }
                      }
                    )
                    setOpenDisplayHashesTableModal(true)
                    setHashesTableModal(hashes)
                    setTitleTableModal('Oracle Id')
                    setTitleModal('Oracles')
                    setUrlTableModal('')
                  }}
                />
              </>
            )
          }
        },
        name: 'Oracle',
        sortable: false,
        minWidth: '350px',
      },
      {
        // eslint-disable-next-line react/display-name
        cell: (row: PositionWithUserBalanceWithDecimals) => {
          const { conditions } = row
          const questionId = conditions[0]?.questionId ?? ''

          const allQuestionIdAreEqual = conditions.every(
            (condition: ConditionInformation) =>
              condition.questionId.toLowerCase() === questionId.toLowerCase()
          )

          if (conditions.length === 1 || allQuestionIdAreEqual) {
            return <Hash value={questionId} />
          } else {
            return (
              <>
                <Hash value={questionId} />
                <ButtonExpandStyled
                  onClick={() => {
                    const hashes: HashArray[] = conditions.map(
                      (condition: ConditionInformation) => {
                        return {
                          hash: condition.questionId,
                        }
                      }
                    )
                    setOpenDisplayHashesTableModal(true)
                    setHashesTableModal(hashes)
                    setTitleTableModal('Question Id')
                    setTitleModal('Questions')
                    setUrlTableModal('')
                  }}
                />
              </>
            )
          }
        },
        name: 'Question Id',
        sortable: false,
        minWidth: '350px',
      },
    ]

    return [...defaultColumns, ...connectedItems, ...menu]
  }, [connectedItems, menu, handleRowClick, networkConfig])

  const onWrap = useCallback(
    async (transferValue: TransferOptions) => {
      if (signer) {
        try {
          setTransactionTitle('Wrapping ERC1155')
          setTransfer(Remote.loading())

          const { address: addressTo, amount, positionId } = transferValue
          const addressFrom = await signer.getAddress()

          await CTService.safeTransferFrom(addressFrom, addressTo, positionId, amount)

          refetchPositions()
          refetchUserPositions()

          setTransfer(Remote.success(transferValue))
        } catch (err) {
          logger.error(err)
          setTransfer(Remote.failure(err))
        }
      } else {
        connect()
      }
    },
    [setTransfer, CTService, connect, refetchPositions, refetchUserPositions, signer]
  )

  const onUnwrap = useCallback(
    async (transferValue: TransferOptions) => {
      if (signer) {
        try {
          setTransactionTitle('Unwrapping ERC20')
          setTransfer(Remote.loading())

          const { address: addressFrom, amount, positionId } = transferValue
          const addressTo = await signer.getAddress()

          await WrapperService.unwrap(addressFrom, positionId, amount, addressTo)

          refetchPositions()
          refetchUserPositions()

          setTransfer(Remote.success(transferValue))
        } catch (err) {
          logger.error(err)
          setTransfer(Remote.failure(err))
        }
      } else {
        connect()
      }
    },
    [WrapperService, connect, signer, setTransfer, refetchPositions, refetchUserPositions]
  )

  const onTransferOutcomeTokens = useCallback(
    async (transferValue: TransferOptions) => {
      if (signer) {
        try {
          setTransactionTitle('Transfer Tokens')
          setTransfer(Remote.loading())

          const { address: addressTo, amount, positionId } = transferValue
          const addressFrom = await signer.getAddress()
          await CTService.safeTransferFrom(addressFrom, addressTo, positionId, amount)

          refetchPositions()
          refetchUserPositions()

          setTransfer(Remote.success(transferValue))
        } catch (err) {
          logger.error(err)
          setTransfer(Remote.failure(err))
        }
      } else {
        connect()
      }
    },
    [signer, CTService, connect, refetchUserPositions, refetchPositions]
  )

  const fullLoadingActionButton = useMemo(
    () =>
      transfer.isSuccess()
        ? {
            buttonType: ButtonType.primary,
            text: 'OK',
            onClick: () => setTransfer(Remote.notAsked<TransferOptions>()),
          }
        : transfer.isFailure()
        ? {
            buttonType: ButtonType.danger,
            text: 'Close',
            onClick: () => setTransfer(Remote.notAsked<TransferOptions>()),
          }
        : undefined,
    [transfer, setTransfer]
  )

  const fullLoadingIcon = useMemo(
    () =>
      transfer.isFailure()
        ? IconTypes.error
        : transfer.isSuccess()
        ? IconTypes.ok
        : IconTypes.spinner,
    [transfer]
  )

  const fullLoadingMessage = useMemo(
    () =>
      transfer.isFailure()
        ? transfer.getFailure()
        : transfer.isLoading()
        ? 'Working...'
        : 'All done!',
    [transfer]
  )

  const fullLoadingTitle = useMemo(() => (transfer.isFailure() ? 'Error' : transactionTitle), [
    transfer,
    transactionTitle,
  ])

  const dropdownItems = usePositionsSearchOptions(setSearchBy)

  const toggleShowFilters = useCallback(() => {
    setShowFilters(!showFilters)
  }, [showFilters])

  const showSpinner = useMemo(() => (isLoading || isSearching) && !error, [
    isLoading,
    isSearching,
    error,
  ])
  const isWorking = useMemo(
    () => transfer.isLoading() || transfer.isFailure() || transfer.isSuccess(),
    [transfer]
  )

  useEffect(() => {
    if (
      textToSearch !== '' ||
      wrappedCollateral !== WrappedCollateralOptions.All ||
      selectedCollateralValue !== CollateralFilterOptions.All ||
      selectedCollateralFilter ||
      selectedToCreationDate ||
      selectedFromCreationDate
    ) {
      setResetPagination(!resetPagination)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    textToSearch,
    wrappedCollateral,
    selectedCollateralValue,
    selectedCollateralFilter,
    selectedToCreationDate,
    selectedFromCreationDate,
  ])

  return (
    <>
      <PageTitle>Positions</PageTitle>
      <TableControls
        end={
          <SearchField
            dropdownItems={dropdownItems}
            onChange={onChangeSearch}
            onClear={onClearSearch}
            value={textToShow}
          />
        }
        start={
          <FiltersSwitchWrapper>
            <Switch active={showFilters} label="Filters" onClick={toggleShowFilters} />
            {(isFiltering || showFilters) && (
              <FilterResultsText>
                Showing filtered results -{' '}
                <FilterResultsControl disabled={!isFiltering} onClick={resetFilters}>
                  Clear Filters
                </FilterResultsControl>
              </FilterResultsText>
            )}
          </FiltersSwitchWrapper>
        }
      />
      {error && !isLoading && <InfoCard message={error.message} title="Error" />}
      {!error && (
        <TwoColumnsCollapsibleLayout isCollapsed={!showFilters}>
          <Sidebar isVisible={showFilters}>
            <SidebarRow>
              <CollateralFilterDropdown
                onClick={(symbol: string, address: Maybe<string[]>) => {
                  setSelectedCollateralFilter(address)
                  setSelectedCollateralValue(symbol)
                }}
                value={selectedCollateralValue}
              />
            </SidebarRow>
            <SidebarRow>
              <WrappedCollateralFilterDropdown
                onClick={(value: WrappedCollateralOptions) => {
                  setWrappedCollateral(value)
                }}
                value={wrappedCollateral}
              />
            </SidebarRow>
            <SidebarRow>
              <DateFilter
                onClear={() => logger.log('Clear date from / to')}
                onSubmit={(from, to) => {
                  setSelectedFromCreationDate(from)
                  setSelectedToCreationDate(to)
                }}
                title="Creation Date"
              />
            </SidebarRow>
          </Sidebar>
          <DataTable
            className="outerTableWrapper"
            columns={getColumns()}
            customStyles={customStyles}
            data={showSpinner ? [] : data || []}
            highlightOnHover
            noDataComponent={
              showSpinner ? (
                <InlineLoading />
              ) : (
                <EmptyContentText>No positions found.</EmptyContentText>
              )
            }
            noHeader
            onRowClicked={handleRowClick}
            pagination
            paginationResetDefaultPage={resetPagination}
            responsive
          />
        </TwoColumnsCollapsibleLayout>
      )}
      {isWrapModalOpen && selectedCollateralToken && (
        <WrapModal
          balance={userBalance}
          decimals={selectedCollateralToken.decimals}
          isOpen={isWrapModalOpen}
          onRequestClose={() => setIsWrapModalOpen(false)}
          onWrap={onWrap}
          positionId={selectedPositionId}
          tokenSymbol={selectedCollateralToken.symbol}
        />
      )}
      {isUnwrapModalOpen && selectedCollateralToken && (
        <UnwrapModal
          balance={userBalance}
          decimals={selectedCollateralToken.decimals}
          isOpen={isUnwrapModalOpen}
          onRequestClose={() => setIsUnwrapModalOpen(false)}
          onUnWrap={onUnwrap}
          positionId={selectedPositionId}
          tokenSymbol={selectedCollateralToken.symbol}
        />
      )}
      {isTransferOutcomeModalOpen && selectedPositionId && selectedCollateralToken && (
        <TransferOutcomeTokensModal
          collateralToken={selectedCollateralToken.address}
          isOpen={isTransferOutcomeModalOpen}
          onRequestClose={() => setIsTransferOutcomeModalOpen(false)}
          onSubmit={onTransferOutcomeTokens}
          positionId={selectedPositionId}
        />
      )}
      {openDisplayHashesTableModal && (
        <DisplayHashesTableModal
          hashes={hashesTableModal}
          isOpen={openDisplayHashesTableModal}
          onRequestClose={() => {
            setOpenDisplayHashesTableModal(false)
            setHashesTableModal([])
            setTitleTableModal('')
          }}
          title={titleModal}
          titleTable={titleTableModal}
          url={urlTableModal}
        />
      )}
      {isWorking && (
        <FullLoading
          actionButton={fullLoadingActionButton}
          icon={fullLoadingIcon}
          message={fullLoadingMessage}
          title={fullLoadingTitle}
        />
      )}
    </>
  )
}
