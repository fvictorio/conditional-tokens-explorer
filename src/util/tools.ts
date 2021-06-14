import { ethers } from 'ethers'
import { Provider } from 'ethers/providers'
import { BigNumber, formatUnits, getAddress } from 'ethers/utils'
import moment from 'moment-timezone'

import axios from 'axios'
import BN from 'bn.js'
import { BYTES_REGEX, OMEN_URL_DAPP } from 'config/constants'
import { NetworkConfig } from 'config/networkConfig'
import { PositionWithUserBalanceWithDecimals } from 'hooks/usePositionsList'
import { ConditionInformation } from 'hooks/utils'
import isEqual from 'lodash.isequal'
import zipObject from 'lodash.zipobject'
import { ConditionalTokensService } from 'services/conditionalTokens'
import { ERC20Service } from 'services/erc20'
import { GetCondition_condition } from 'types/generatedGQLForCTE'
import { CollateralErrors, ConditionErrors, NetworkIds, PositionErrors, Token } from 'util/types'

const ZERO_BN = new BN(0)
const ONE_BN = new BN(1)

export const isAddress = (address: string) => {
  try {
    getAddress(address)
  } catch (e) {
    return false
  }
  return true
}

export const isContract = async (provider: Provider, address: string): Promise<boolean> => {
  const code = await provider.getCode(address)
  return !!code && code !== '0x'
}

export const range = (max: number): number[] => {
  return Array.from(new Array(max), (_, i) => i)
}

// Generate array of length size with values from 2^0 to 2^(size-1)
export const trivialPartition = (size: number) => {
  return range(size).reduce((acc: BigNumber[], _, index: number) => {
    const two = new BigNumber(2)
    acc.push(two.pow(index))
    return acc
  }, [])
}

export const formatBigNumber = (value: BigNumber, decimals: number, precision = 2): string =>
  Number(formatUnits(value, decimals)).toFixed(precision)

export const isBytes32String = (s: string): boolean => BYTES_REGEX.test(s)

export const isConditionIdValid = (conditionId: string): boolean => isBytes32String(conditionId)

export const isPositionIdValid = (positionId: string): boolean => isBytes32String(positionId)

export const truncateStringInTheMiddle = (
  str: string,
  strPositionStart: number,
  strPositionEnd: number
) => {
  const minTruncatedLength = strPositionStart + strPositionEnd
  if (minTruncatedLength < str.length) {
    return `${str.substr(0, strPositionStart)}...${str.substr(
      str.length - strPositionEnd,
      str.length
    )}`
  }
  return str
}

export const getConditionTypeTitle = (templateId: Maybe<number>) => {
  if (templateId === 5 || templateId === 6) {
    return 'Nuanced Binary'
  } else if (templateId === 2) {
    return 'Categorical'
  } else {
    return 'Binary'
  }
}

export const formatDate = (date: Date): string => {
  return moment(date).tz('UTC').format('YYYY-MM-DD - HH:mm [UTC]')
}

export const formatTS = (timestamp: number): string => {
  return moment.unix(timestamp).utc().format('YYYY-MM-DD - HH:mm [UTC]')
}

export const formatTSAlt = (timestamp: number): string => {
  return moment.unix(timestamp).utc().format('MMM D, YYYY - HH:mm')
}

export const formatTSSimple = (timestamp: number): string => {
  return moment.unix(timestamp).utc().format('YYYY-MM-DD')
}

export const isConditionErrorInvalid = (errors: ConditionErrors[]): boolean =>
  errors.indexOf(ConditionErrors.INVALID_ERROR) > -1

export const isConditionErrorFetching = (errors: ConditionErrors[]): boolean =>
  errors.indexOf(ConditionErrors.FETCHING_ERROR) > -1

export const isConditionErrorNotIndexed = (errors: ConditionErrors[]): boolean =>
  errors.indexOf(ConditionErrors.NOT_INDEXED_ERROR) > -1

export const isConditionErrorNotFound = (errors: ConditionErrors[]): boolean =>
  errors.indexOf(ConditionErrors.NOT_FOUND_ERROR) > -1

export const isConditionErrorNotResolved = (errors: ConditionErrors[]): boolean =>
  errors.indexOf(ConditionErrors.NOT_RESOLVED_ERROR) > -1

export const isPositionErrorInvalid = (errors: PositionErrors[]): boolean =>
  errors.indexOf(PositionErrors.INVALID_ERROR) > -1

export const isPositionErrorFetching = (errors: PositionErrors[]): boolean =>
  errors.indexOf(PositionErrors.FETCHING_ERROR) > -1

export const isPositionErrorNotFound = (errors: PositionErrors[]): boolean =>
  errors.indexOf(PositionErrors.NOT_FOUND_ERROR) > -1

export const isPositionErrorEmptyBalanceERC1155 = (errors: PositionErrors[]): boolean =>
  errors.indexOf(PositionErrors.EMPTY_BALANCE_ERC1155_ERROR) > -1

export const isPositionErrorEmptyBalanceERC20 = (errors: PositionErrors[]): boolean =>
  errors.indexOf(PositionErrors.EMPTY_BALANCE_ERC20_ERROR) > -1

export const divBN = (a: BigNumber, b: BigNumber, scale = 10000): number => {
  return a.mul(scale).div(b).toNumber() / scale
}

export const mulBN = (a: BigNumber, b: number, scale = 10000): BigNumber => {
  return a.mul(Math.round(b * scale)).div(scale)
}

export const positionString = (
  conditionIds: string[],
  indexSets: string[],
  balance: BigNumber,
  token: Token
) => {
  return `[${token.symbol.toUpperCase()} ${conditionIds
    .map((conditionId, i) => {
      return `C:${truncateStringInTheMiddle(conditionId, 8, 6)} O:${outcomeString(indexSets[i])}`
    })
    .join(' & ')}] x${formatBigNumber(balance, token.decimals, 2)}`
}

const outcomeString = (indexSet: string) =>
  indexSetToBase2(indexSet)
    .split('')
    .reverse()
    .reduce((acc, e, i) => (e !== '0' ? [...acc, i] : acc), new Array<number>())
    .join('|')

export const indexSetToBase2 = (indexSet: string) => {
  return new BN(indexSet).toString(2)
}
export const getRedeemedBalance = (
  position: PositionWithUserBalanceWithDecimals,
  resolvedCondition: GetCondition_condition,
  balance: BigNumber
) => {
  const conditionIndex = position.conditions.findIndex(
    ({ conditionId }) => conditionId === resolvedCondition.id
  )
  const indexSet = position.indexSets[conditionIndex]

  const { payouts } = resolvedCondition
  const positionOutcomes = indexSetToBase2(indexSet).split('').reverse()

  return positionOutcomes.reduce((acc, posOutcome, i) => {
    const payout = payouts?.[i] as Maybe<string>
    if (posOutcome === '1' && payout) {
      return acc.add(mulBN(balance, Number(payout)))
    }

    return acc
  }, new BigNumber(0))
}

export const getRedeemedPreview = (
  position: PositionWithUserBalanceWithDecimals,
  conditionId: string,
  redeemedBalance: BigNumber,
  token: Token
) => {
  if (position.conditions.length > 1) {
    const conditionIndex = position.conditions.findIndex(
      (condition: ConditionInformation) => condition.conditionId === conditionId
    )
    const filteredConditionIds = position.conditionIds.filter((_, i) => i !== conditionIndex)
    const filteredIndexSets = position.indexSets.filter((_, i) => i !== conditionIndex)

    return positionString(filteredConditionIds, filteredIndexSets, redeemedBalance, token)
  }

  return `${formatBigNumber(redeemedBalance, token.decimals)} ${token.symbol}`
}

export const positionsSameConditionsSet = (positions: PositionWithUserBalanceWithDecimals[]) => {
  // all postions include same conditions set and collateral token
  return positions.every((position) => isEqual(position.conditionIds, positions[0].conditionIds))
}

// more than 1 position
// same collateral
// same conditions set
export const arePositionMergeables = (positions: PositionWithUserBalanceWithDecimals[]) => {
  return (
    positions.length > 1 &&
    positions.every((position) => position.collateralToken === positions[0].collateralToken) &&
    positionsSameConditionsSet(positions)
  )
}

// disjoint partition
export const arePositionMergeablesByCondition = (
  positions: PositionWithUserBalanceWithDecimals[],
  conditionId: string,
  outcomeSlotCount: number
) => {
  return (
    arePositionMergeables(positions) &&
    isConditionDisjoint(positions, conditionId, outcomeSlotCount)
  )
}

// TODO This is used with the assumption that our desired condition is common to that position.
// But we only check that every position has a condition in common
// An option is to check if this dictionary is undefined for some conditionId.
export const indexSetsByCondition = (position: PositionWithUserBalanceWithDecimals) => {
  return zipObject(position.conditionIds, position.indexSets as string[])
}

export const isConditionFullIndexSet = (
  positions: PositionWithUserBalanceWithDecimals[],
  conditionId: string,
  outcomeSlotCount: number
) => {
  const partition = positions.map((position) => indexSetsByCondition(position)[conditionId])

  return isFullIndexSetPartition(partition, outcomeSlotCount)
}

export const isConditionDisjoint = (
  positions: PositionWithUserBalanceWithDecimals[],
  conditionId: string,
  outcomeSlotCount: number
) => {
  const partition = positions.map((position) => indexSetsByCondition(position)[conditionId])

  return isDisjointPartition(partition, outcomeSlotCount)
}

export const isDisjointPartition = (partition: string[], outcomeSlotCount: number) => {
  if (partition.length <= 1 || outcomeSlotCount === 0) {
    return false
  }

  let isDisjoint = true
  const fullIndexSet = getFullIndexSet(outcomeSlotCount)
  let freeIndexSet = fullIndexSet

  for (const indexSet of partition) {
    if (!validIndexSet(fullIndexSet, indexSet)) {
      isDisjoint = false
      break
    }

    if (andIndexSets(indexSet, freeIndexSet) !== indexSet) {
      isDisjoint = false
      break
    }
    freeIndexSet = xorIndexSets(freeIndexSet, indexSet)
  }
  return isDisjoint
}

export const isFullIndexSetPartition = (partition: string[], outcomeSlotCount: number) => {
  if (!isDisjointPartition(partition, outcomeSlotCount)) {
    return false
  }

  const fullIndexSet = getFullIndexSet(outcomeSlotCount)
  const partitionSum = partition.reduce((acc, indexSet) => orIndexSets(acc, indexSet))

  return partitionSum === fullIndexSet
}

// All implementation details are hidden behind string type
export const getFullIndexSet = (outcomeSlotCount: number) => {
  return ONE_BN.shln(outcomeSlotCount).sub(ONE_BN).toString()
}

export const getFreeIndexSet = (outcomeSlotCount: number, partition: string[]): string => {
  const fullIndexSet = new BN(getFullIndexSet(outcomeSlotCount))

  return partition
    .reduce((acc, p) => {
      return acc.xor(new BN(p))
    }, fullIndexSet)
    .toString()
}

export const isPartitionFullIndexSet = (
  outcomesSlotCount: number,
  partition: string[]
): boolean => {
  const freeIndexSet = new BN(getFreeIndexSet(outcomesSlotCount, partition))
  return freeIndexSet.eq(ZERO_BN)
}

export const orIndexSets = (indexSetA: string, indexSetB: string) => {
  const a = new BN(indexSetA)
  const b = new BN(indexSetB)

  return a.or(b).toString()
}
export const andIndexSets = (indexSetA: string, indexSetB: string) => {
  const a = new BN(indexSetA)
  const b = new BN(indexSetB)

  return a.and(b).toString()
}

export const xorIndexSets = (indexSetA: string, indexSetB: string) => {
  const a = new BN(indexSetA)
  const b = new BN(indexSetB)

  return a.xor(b).toString()
}

const validIndexSet = (fullIndexSet: string, indexSetA: string) => {
  const fullIndexSetBN = new BN(fullIndexSet)
  const indexSetABN = new BN(indexSetA)
  return indexSetABN.gt(ZERO_BN) && indexSetABN.lte(fullIndexSetBN)
}

export const getMergePreview = (
  positions: PositionWithUserBalanceWithDecimals[],
  conditionId: string,
  amount: BigNumber,
  token: Token,
  outcomeSlotCount: number
) => {
  if (isConditionFullIndexSet(positions, conditionId, outcomeSlotCount)) {
    return getRedeemedPreview(positions[0], conditionId, amount, token)
  } else {
    // this assumes all positions have same conditions set order
    const conditionIndex = positions[0].conditionIds.findIndex((id) => id === conditionId)

    // For all positions sum values on their indexSets corresponding to the given condition
    const newIndexSet = positions
      .map((position) => indexSetsByCondition(position)[conditionId])
      .reduce((acc, val) => orIndexSets(acc, val))

    // Maintain all indexSet the same except for the ones changed
    const newIndexSets = positions[0].indexSets.map((indexSet, index) =>
      index === conditionIndex ? newIndexSet : indexSet
    )
    return positionString(positions[0].conditionIds, newIndexSets, amount, token)
  }
}

export const indexSetFromOutcomes = (outcomes: string[]): string => {
  return outcomes
    .map((outcome) => new BN(outcome))
    .sort((a, b) => a.cmp(b))
    .reduce((acc, indexSet) => acc.or(indexSet))
    .toString()
}

export const minBigNumber = (values: BigNumber[]) =>
  values.reduce((min, value) => (min.lte(value) ? min : value), values[0])

/**
 * Convert message texts from Error.message from a collateral error messages
 * it an error is not recognized by enum `CollateralErrors` it will the first message
 * text and capitalize the firt letter.
 * @param error Error type to convert message attribute
 */
export const humanizeCollateralMessageError = (error: Error) => {
  if (error.message.includes('invalid address')) {
    error.message = CollateralErrors.INVALID_ADDRESS.toString()
  } else if (error.message.includes('ENS name not configured')) {
    error.message = CollateralErrors.ENS_NOT_FOUND.toString()
  } else if (error.message.includes('bad address checksum')) {
    error.message = CollateralErrors.BAD_ADDRESS_CHECKSUM.toString()
  } else if (error.message.includes('contract not deployed')) {
    error.message = CollateralErrors.IS_NOT_ERC20.toString()
  } else {
    error = improveErrorMessage(error)
  }
  return error
}

export const improveErrorMessage = (error: Error): Error => {
  if (error.message.indexOf('(') !== -1) {
    error.message = error.message.split('(')[0]
    error.message = error.message[0].toUpperCase() + error.message.substr(1)
  }
  return error
}

export const getTokenSummary = async (
  networkConfig: NetworkConfig,
  provider: Provider,
  collateralToken: string
): Promise<Token> => {
  const token = networkConfig.getTokenFromAddress(collateralToken)

  if (token) {
    const { address, decimals, symbol } = token
    return {
      address,
      decimals,
      symbol,
    }
  } else {
    try {
      const erc20Service = new ERC20Service(provider, collateralToken)
      const { address, decimals, name, symbol } = await erc20Service.getProfileSummary()

      return {
        address,
        decimals,
        symbol,
        name,
      }
    } catch (err) {
      humanizeCollateralMessageError(err)
      throw Error(err)
    }
  }
}

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

export const getRealityQuestionUrl = (questionId: string, networkConfig: NetworkConfig) => {
  const oracle = networkConfig.getOracleFromName('reality')
  return networkConfig.networkId === NetworkIds.GANACHE
    ? '#'
    : `${oracle.url}app/#!/question/${questionId}`
}

export const getOmenMarketURL = (marketId: string) => {
  return `${OMEN_URL_DAPP}/#/${marketId}`
}

export const isOracleRealitio = (oracleAddress: string, networkConfig: NetworkConfig) => {
  const oracle = networkConfig.getOracleFromAddress(oracleAddress)
  return oracle.name === ('reality' as KnownOracle)
}

export const getParentCollectionId = (
  indexSets: string[],
  conditionIds: string[],
  conditionId: string
) => {
  const newCollectionsSet = conditionIds.reduce(
    (acc, id, i) =>
      id !== conditionId
        ? [...acc, { conditionId: id, indexSet: new BigNumber(indexSets[i]) }]
        : acc,
    new Array<{ conditionId: string; indexSet: BigNumber }>()
  )
  return newCollectionsSet.length
    ? ConditionalTokensService.getCombinedCollectionId(newCollectionsSet)
    : ethers.constants.HashZero
}

export const sleep = (milliseconds = 1000) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })

export const getGraphMeta = async (networkConfig: NetworkConfig) => {
  const query = `
    query Meta {
      _meta {
        block {
          hash
          number
        }
      }
    }
  `
  const { CTEhttpUri } = networkConfig.getGraphUris()
  const result = await axios.post(CTEhttpUri, { query })
  return result.data.data._meta.block
}

export const waitForBlockToSync = async (networkConfig: NetworkConfig, blockNum: number) => {
  let block
  while (!block || block.number < blockNum + 1) {
    block = await getGraphMeta(networkConfig)
    await sleep()
  }
}
