import { BigNumber } from 'ethers/utils'
import { Moment } from 'moment'

import { NetworkConfig } from 'config/networkConfig'
import { PositionWithUserBalanceWithDecimals } from 'hooks/usePositionsList'

export interface Question {
  arbitratorAddress: string
  category: string
  id: string
  outcomes: string[]
  raw: string
  resolution: Date
  templateId: number
  title: string
}

export interface QuestionLog {
  category: string
  lang: string
  outcomes?: string[]
  title: string
  type: string
}

export enum ConditionStatus {
  Open = 'Open',
  Resolved = 'Resolved',
}

export enum WrappedCollateralOptions {
  All = 'all',
  Yes = 'yes',
  No = 'no',
}

export enum WithBalanceOptions {
  All = 'all',
  Yes = 'yes',
  No = 'no',
}

export enum ValidityOptions {
  All = 'all',
  Invalid = 'invalid',
  Valid = 'valid',
}

export enum ConditionType {
  omen = 'Omen Condition',
  custom = 'Custom Reporter',
}

export enum ConditionTypeAll {
  all = 'All',
}

export enum QuestionType {
  nuancedBinary = 'Nuanced Binary',
  categorical = 'Categorical',
  binary = 'Binary',
}

export enum Categories {
  businessAndFinance = 'Business & finance',
  cryptocurrency = 'Cryptocurrency',
  newsAndPolitics = 'News & politics',
  scienceAndTech = 'Science & tech',
  sports = 'Sports',
  weather = 'Weather',
  miscellaneous = 'Miscellaneous',
}

export enum ConditionErrors {
  INVALID_ERROR = `Invalid condition`,
  FETCHING_ERROR = `Error fetching condition`,
  NOT_FOUND_ERROR = `Condition doesn't exist`,
  NOT_RESOLVED_ERROR = `Condition is not resolved`,
  NOT_INDEXED_ERROR = `Condition is not indexed yet`,
}

export enum PositionErrors {
  INVALID_ERROR = `Invalid position`,
  FETCHING_ERROR = `Error fetching position`,
  NOT_FOUND_ERROR = `Position doesn't exist`,
  EMPTY_BALANCE_ERC1155_ERROR = `User doesn't have position balance`,
  EMPTY_BALANCE_ERC20_ERROR = `User doesn't have erc20 balance`,
}

export enum BalanceErrors {
  INVALID_ERROR = `Invalid position`,
  FETCHING_ERROR = `Error fetching balance`,
  EMPTY_BALANCE_ERC1155_ERROR = `User doesn't have position balance`,
  EMPTY_BALANCE_ERC20_ERROR = `User doesn't have erc20 balance`,
}

export enum CollateralErrors {
  INVALID_ADDRESS = `Invalid address`,
  BAD_ADDRESS_CHECKSUM = `Bad address checksum`,
  ENS_NOT_FOUND = `ENS name not found`,
  IS_NOT_ERC20 = `The given address in not an ERC20 contract`,
}

export type Errors = ConditionErrors | PositionErrors | BalanceErrors | CollateralErrors

export type Token = {
  symbol: string
  address: string
  decimals: number
  name?: string
}

export type NetworkId = 1 | 4 | 50 | 100

export enum NetworkIds {
  MAINNET = 1,
  RINKEBY = 4,
  GANACHE = 50,
  XDAI = 100,
}

export enum Status {
  Ready = 'Ready',
  Loading = 'Loading',
  Refreshing = 'Refreshing',
  Done = 'Done',
  Error = 'Error',
}

export type Oracle = {
  address: string
  description: string
  name: KnownOracle
  url: string
}

export type Arbitrator = {
  address: string
  description: string
  name: KnownArbitrator
  url: string
}

export interface OutcomeProps {
  id: string
  value: number
  text?: string
}

export enum SplitFromType {
  collateral = 'collateral',
  position = 'position',
}

export enum OracleFilterOptions {
  All = 'all',
  Custom = 'custom',
  Current = 'current',
  Kleros = 'kleros',
  Reality = 'reality',
}

export enum StatusOptions {
  All = 'all',
  Resolved = 'resolved',
  Open = 'open',
}

export enum CollateralFilterOptions {
  All = 'all',
  Custom = 'custom',
}

export type PositionIdsArray = {
  positionId: string
  balance: BigNumber
}

export interface SplitStatus {
  positionIds: PositionIdsArray[]
  collateral: string
}

export interface TransferOptions {
  amount: BigNumber
  address: string
  positionId: string
  tokenBytes: string
}

export type HashArray = {
  hash: string
  title?: string
  url?: string
}

export interface QuestionOptions {
  arbitrator: string
  category: string
  openingDateMoment: Moment
  outcomes: string[]
  question: string
  networkConfig: NetworkConfig
  signerAddress: string
}

export enum ConditionSearchOptions {
  All = 'all',
  ConditionId = 'conditionId',
  QuestionId = 'questionId',
  QuestionText = 'questionText',
  OracleAddress = 'oracleAddress',
  CreatorAddress = 'creatorAddress',
}

export interface AdvancedFilterConditions {
  ReporterOracle: {
    type: OracleFilterOptions
    value: Array<string>
  }
  ConditionType: {
    type: ConditionType | ConditionTypeAll
    value: Maybe<string>
  }
  Status: StatusOptions
  MinOutcomes: Maybe<number>
  MaxOutcomes: Maybe<number>
  FromCreationDate: Maybe<number>
  ToCreationDate: Maybe<number>
  TextToSearch: {
    type: ConditionSearchOptions
    value: Maybe<string>
  }
}

export enum PositionSearchOptions {
  All = 'all',
  ConditionId = 'conditionId',
  PositionId = 'positionId',
  CollateralSymbol = 'collateralSymbol',
  CollateralAddress = 'collateralAddress',
  WrappedCollateralAddress = 'wrappedCollateralAddress',
}

export enum LandingSearchOptions {
  All = 'all',
  ConditionId = 'conditionId',
  QuestionId = 'questionId',
  QuestionText = 'questionText',
  OracleAddress = 'oracleAddress',
  CreatorAddress = 'creatorAddress',
  PositionId = 'positionId',
  CollateralSymbol = 'collateralSymbol',
  CollateralAddress = 'collateralAddress',
  WrappedCollateralAddress = 'wrappedCollateralAddress',
}

export interface AdvancedFilterPosition {
  CollateralValue: {
    type: Maybe<string>
    value: Maybe<string[]>
  }
  FromCreationDate: Maybe<number>
  ToCreationDate: Maybe<number>
  TextToSearch: {
    type: PositionSearchOptions
    value: Maybe<string>
  }
  WrappedCollateral: WrappedCollateralOptions
}

export interface MergeablePosition {
  position: PositionWithUserBalanceWithDecimals
  positionPreview: string
}
