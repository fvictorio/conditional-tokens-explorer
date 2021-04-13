import { ethers } from 'ethers'
import { InfuraProvider, JsonRpcSigner, Web3Provider } from 'ethers/providers'
import React from 'react'
import Web3Modal from 'web3modal'

import WalletConnectProvider from '@walletconnect/web3-provider'
import { DEFAULT_NETWORK_ID, INFURA_ID, RPC_XDAI_CHAIN } from 'config/constants'
import { NetworkConfig } from 'config/networkConfig'
import { useLocalStorage } from 'hooks/useLocalStorageValue'
import { ConditionalTokensService } from 'services/conditionalTokens'
import { CPKService as CPKServiceClass } from 'services/cpk'
import { RealityService } from 'services/reality'
import { Wrapper1155Service } from 'services/wrapper1155'
import { createCPK } from 'util/cpk'
import { getLogger } from 'util/logger'

export enum Web3ContextStatus {
  NotAsked = 'notAsked',
  WaitingForUser = 'waitingForUser',
  Connecting = 'connecting',
  Error = 'error',
  WrongNetwork = 'wrongNetwork',
  Connected = 'connected',
  Infura = 'infura',
}

export type NotAsked = {
  _type: Web3ContextStatus.NotAsked
}

type WaitingForUser = {
  _type: Web3ContextStatus.WaitingForUser
}

type Connecting = {
  _type: Web3ContextStatus.Connecting
}

type ErrorWeb3 = {
  _type: Web3ContextStatus.Error
  error: Error
}

type WrongNetwork = {
  _type: Web3ContextStatus.WrongNetwork
  error: Error
}

export type Connected = {
  _type: Web3ContextStatus.Connected
  provider: Web3Provider
  address: string
  cpkAddress: string
  signer: JsonRpcSigner
  networkConfig: NetworkConfig
  CTService: ConditionalTokensService
  RtyService: RealityService
  WrapperService: Wrapper1155Service
  CPKService: CPKServiceClass
  disconnect: () => void
}

export type Infura = {
  _type: Web3ContextStatus.Infura
  provider: InfuraProvider
  networkConfig: NetworkConfig
  CTService: ConditionalTokensService
  RtyService: RealityService
  WrapperService: Wrapper1155Service
  connect: () => void
}

export type Web3Status =
  | NotAsked
  | WaitingForUser
  | Connecting
  | Connected
  | ErrorWeb3
  | Infura
  | WrongNetwork

export interface ConnectedWeb3Context {
  status: Web3Status
  connect: () => void
  disconnect: () => void
  toggleCPK: () => void
  isUsingTheCPKAddress: () => boolean
  refresh: boolean
}

export const Web3Context = React.createContext<Maybe<ConnectedWeb3Context>>(null)

interface Props {
  children: JSX.Element
}

const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: INFURA_ID,
        rpc: {
          100: RPC_XDAI_CHAIN,
        },
      },
    },
  },
})

const logger = getLogger('Web3Context')

export const Web3ContextProvider = ({ children }: Props) => {
  const [web3Status, setWeb3Status] = React.useState<Web3Status>({
    _type: Web3ContextStatus.NotAsked,
  })

  const { getValue, setValue } = useLocalStorage(`isUsingTheCPK`)

  const isUsingTheCPKAddress = React.useCallback(() => getValue(false), [getValue])

  const [refresh, setRefresh] = React.useState<boolean>(false)

  const toggleCPK = React.useCallback(() => {
    setValue(!isUsingTheCPKAddress())
    setRefresh(!refresh)
  }, [isUsingTheCPKAddress, refresh, setValue])

  const resetApp = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (provider: any) => {
      if (provider._web3Provider && provider._web3Provider.disconnect) {
        logger.log('Disconnecting _web3Provider provider')
        await provider._web3Provider.disconnect()
      }

      if (provider.close) {
        logger.log('Clossing provider')
        await provider.close()
      }

      logger.log('Clearing cache')
      await web3Modal.clearCachedProvider()

      setWeb3Status({ _type: Web3ContextStatus.NotAsked } as Web3Status)
    },
    [setWeb3Status]
  )

  const subscribeProvider = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (provider: any) => {
      logger.log('Trying to subscribe to metamask events...', web3Status._type)

      provider.once('close', () => {
        logger.log('Provider is closing...')
        resetApp(provider)
      })

      provider.once('disconnect', () => {
        logger.log('Provider is disconnecting...')
        resetApp(provider)
      })

      provider.once('accountsChanged', async (accounts: string[]) => {
        if (accounts.length > 0) {
          const address = accounts[0]
          logger.log(`Switch account to ${address}`)

          setWeb3Status({
            ...web3Status,
            address,
          } as Connected)
        } else {
          // Metamask send an `accountsChanged` event when lock account
          logger.error('accounts is empty')
          await resetApp(provider)
        }
      })

      provider.once('networkChanged', async (networkId: number) => {
        logger.log(`Switch network to ${networkId}`)

        // The sign `plus` is needed, because javascript and reasons
        if (NetworkConfig.isKnownNetwork(+networkId)) {
          const networkConfig = new NetworkConfig(networkId)

          setWeb3Status({
            ...web3Status,
            networkConfig,
          } as Connected)
        } else {
          setWeb3Status({
            _type: Web3ContextStatus.WrongNetwork,
            error: new Error('Wrong network'),
          } as WrongNetwork)
        }
      })
    },
    [web3Status, resetApp]
  )

  const disconnectWeb3Modal = React.useCallback(async () => {
    if (web3Status._type !== Web3ContextStatus.Connected) {
      logger.log('Return because web3Status is not connected')
      return
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = web3Status.provider as any
      await resetApp(provider)
    } catch (error) {
      setWeb3Status({ _type: Web3ContextStatus.Error, error } as ErrorWeb3)
      logger.error(`Error resetting provider: ${error}`)
      return
    }
  }, [web3Status, resetApp])

  const connectWeb3Modal = React.useCallback(async () => {
    let web3Provider: Web3Provider
    try {
      setWeb3Status({ _type: Web3ContextStatus.Connecting })
      web3Provider = await web3Modal.connect()
    } catch (error) {
      web3Modal.clearCachedProvider()

      if (error && error.match(/modal closed/i)) {
        setWeb3Status({ _type: Web3ContextStatus.NotAsked })
        return
      }

      setWeb3Status({ _type: Web3ContextStatus.Error, error } as ErrorWeb3)
      return
    }

    try {
      const provider = new ethers.providers.Web3Provider(web3Provider)
      const networkId = (await provider.getNetwork()).chainId

      if (NetworkConfig.isKnownNetwork(networkId)) {
        const signer = provider.getSigner()
        subscribeProvider(web3Provider)

        logger.log('Updating connected information...')

        const networkConfig = new NetworkConfig(networkId)
        const RtyService = new RealityService(networkConfig, provider, signer)
        const CTService = new ConditionalTokensService(networkConfig, provider, signer)
        const WrapperService = new Wrapper1155Service(networkConfig, provider, signer)
        const cpk = await createCPK(provider, networkConfig)
        const CPKService = new CPKServiceClass(cpk, provider, networkConfig)

        const address = await signer.getAddress()

        setWeb3Status({
          _type: Web3ContextStatus.Connected,
          provider,
          signer,
          networkConfig,
          CTService,
          RtyService,
          WrapperService,
          CPKService,
          address,
          cpkAddress: CPKService.address,
        } as Connected)
      } else {
        setWeb3Status({
          _type: Web3ContextStatus.WrongNetwork,
          error: new Error('Wrong network'),
        } as WrongNetwork)
      }
    } catch (error) {
      setWeb3Status({ _type: Web3ContextStatus.Error, error } as ErrorWeb3)
    }
  }, [subscribeProvider])

  const connectInfura = React.useCallback(async () => {
    try {
      const provider = new ethers.providers.InfuraProvider(DEFAULT_NETWORK_ID, INFURA_ID)

      const networkId = (await provider.getNetwork()).chainId
      if (NetworkConfig.isKnownNetwork(networkId)) {
        const networkConfig = new NetworkConfig(networkId)
        const RtyService = new RealityService(networkConfig, provider)
        const CTService = new ConditionalTokensService(networkConfig, provider)
        const WrapperService = new Wrapper1155Service(networkConfig, provider)
        setWeb3Status({
          _type: Web3ContextStatus.Infura,
          provider,
          networkConfig,
          CTService,
          RtyService,
          WrapperService,
        } as Infura)
      } else {
        setWeb3Status({
          _type: Web3ContextStatus.WrongNetwork,
          error: new Error('Wrong network'),
        } as WrongNetwork)
      }
    } catch (error) {
      setWeb3Status({ _type: Web3ContextStatus.Error, error } as ErrorWeb3)
    }
  }, [])

  // By default try to reach Infura
  React.useEffect(() => {
    if (web3Status._type === Web3ContextStatus.NotAsked) {
      connectInfura()
    }
  }, [connectInfura, web3Status._type])

  // If a cachedProvider is present, continue with web3Modal connection
  React.useEffect(() => {
    if (web3Modal.cachedProvider && web3Status._type === Web3ContextStatus.Infura) {
      connectWeb3Modal()
    }
  }, [connectWeb3Modal, web3Status._type])

  return (
    <Web3Context.Provider
      value={{
        status: web3Status,
        connect: connectWeb3Modal,
        disconnect: disconnectWeb3Modal,
        toggleCPK,
        isUsingTheCPKAddress,
        refresh,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3Context = () => {
  const context = React.useContext(Web3Context)
  if (!context) {
    throw new Error('[useWeb3Context] Hook not used under web3 context provider')
  }
  return context
}

export const useWeb3Connected = () => {
  const { disconnect, isUsingTheCPKAddress, refresh, status, toggleCPK } = useWeb3Context()
  if (status._type === Web3ContextStatus.Connected) {
    return { ...status, disconnect, toggleCPK, isUsingTheCPKAddress, refresh }
  }
  throw new Error('[useWeb3Connected] Hook not used under a connected context')
}

export const useWeb3ConnectedOrInfura = () => {
  const { connect, disconnect, isUsingTheCPKAddress, refresh, status, toggleCPK } = useWeb3Context()
  if (status._type === Web3ContextStatus.Connected || status._type === Web3ContextStatus.Infura) {
    return {
      ...status,
      CPKService: status._type === Web3ContextStatus.Connected ? status.CPKService : null,
      address: status._type === Web3ContextStatus.Connected ? status.address : null,
      cpkAddress: status._type === Web3ContextStatus.Connected ? status.cpkAddress : null,
      signer: status._type === Web3ContextStatus.Connected ? status.signer : null,
      connect,
      disconnect,
      toggleCPK,
      isUsingTheCPKAddress,
      refresh,
    }
  }

  throw new Error('[useWeb3Connected] Hook not used under a connected or infura context')
}

export const useWeb3Disconnected = () => {
  const context = useWeb3Context()
  if (
    context.status._type === Web3ContextStatus.NotAsked ||
    context.status._type === Web3ContextStatus.Infura
  ) {
    return context
  }
  throw new Error('[useWeb3Disconnected] Hook not used under a disconnected context')
}
