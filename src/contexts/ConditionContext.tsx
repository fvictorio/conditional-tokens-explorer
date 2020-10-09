import { useQuery } from '@apollo/react-hooks'
import React from 'react'
import { useLocation } from 'react-router-dom'

import { useWeb3ConnectedOrInfura } from 'contexts/Web3Context'
import { GetConditionQuery } from 'queries/CTEConditions'
import { GetCondition, GetCondition_condition } from 'types/generatedGQLForCTE'
import { isConditionIdValid } from 'util/tools'
import { ConditionErrors, LocationRouterState } from 'util/types'

export interface ConditionContext {
  clearCondition: () => void
  condition: Maybe<GetCondition_condition>
  conditionId: string
  errors: ConditionErrors[]
  loading: boolean
  isConditionIdEventTriggered: Maybe<boolean>
  setCondition: (condition: GetCondition_condition) => void
  setConditionId: (conditionId: string) => void
}

export const CONDITION_CONTEXT_DEFAULT_VALUE = {
  condition: null,
  conditionId: '',
  loading: false,
  isConditionIdEventTriggered: false,
  errors: [],
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setConditionId: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setCondition: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clearCondition: () => {},
}

const ConditionContext = React.createContext<ConditionContext>(CONDITION_CONTEXT_DEFAULT_VALUE)

interface Props {
  checkForConditionNotResolved?: boolean
  children: React.ReactNode
}

export const ConditionProvider = (props: Props) => {
  const { checkForConditionNotResolved } = props

  const { CTService, networkConfig } = useWeb3ConnectedOrInfura()

  const [conditionId, setConditionId] = React.useState('')
  const [condition, setCondition] = React.useState<Maybe<GetCondition_condition>>(null)
  const [isConditionIdEventTriggered, setIsConditionIdEventTriggered] = React.useState<
    Maybe<boolean>
  >(null)
  const [
    isCheckingConditionIdEventTriggered,
    setIsCheckingConditionIdEventTriggered,
  ] = React.useState<boolean>(false)
  const [errors, setErrors] = React.useState<ConditionErrors[]>([])
  const [validId, setValidId] = React.useState(false)

  const location = useLocation<LocationRouterState>()
  const clearErrors = React.useCallback((): void => {
    setErrors([])
  }, [])

  const removeError = React.useCallback((error): void => {
    setErrors((errors) => (errors ? errors.filter((e) => e !== error) : []))
  }, [])

  const pushError = React.useCallback((newError): void => {
    setErrors((errors) => Array.from(new Set(errors).add(newError)))
  }, [])

  const clearCondition = React.useCallback((): void => {
    setConditionId('')
    setCondition(null)
    clearErrors()
  }, [clearErrors])

  const setConditionIdCallback = React.useCallback(
    (conditionId: string): void => {
      clearCondition()
      removeError(ConditionErrors.INVALID_ERROR)

      if (isConditionIdValid(conditionId)) {
        setValidId(true)
        setConditionId(conditionId)
      } else if (conditionId !== '') {
        pushError(ConditionErrors.INVALID_ERROR)
      }
    },
    [clearCondition, pushError, removeError]
  )

  const setConditionCallback = React.useCallback(
    (condition: GetCondition_condition): void => {
      clearCondition()
      setCondition(condition)
    },
    [clearCondition]
  )

  const { data: fetchedCondition, error: errorFetchingCondition, loading } = useQuery<GetCondition>(
    GetConditionQuery,
    {
      variables: { id: conditionId },
      fetchPolicy: 'no-cache',
      skip: !conditionId || !validId,
    }
  )

  React.useEffect(() => {
    let cancelled = false
    if (conditionId) {
      setIsCheckingConditionIdEventTriggered(true)
      const fetchConditionIdEvent = async () => {
        try {
          const isConditionCreationEventTriggered = await CTService.isConditionCreationEventTriggered(
            conditionId,
            networkConfig
          )
          if (!cancelled) setIsConditionIdEventTriggered(isConditionCreationEventTriggered)
        } catch {
          if (!cancelled) setIsConditionIdEventTriggered(null)
        } finally {
          if (!cancelled) setIsCheckingConditionIdEventTriggered(false)
        }
      }
      fetchConditionIdEvent()
    }

    return () => {
      cancelled = true
    }
  }, [conditionId, CTService, networkConfig])

  React.useEffect(() => {
    const { condition: conditionFromTheGraph } = fetchedCondition ?? { condition: null }
    removeError(ConditionErrors.NOT_FOUND_ERROR)
    removeError(ConditionErrors.NOT_INDEXED_ERROR)

    if (
      conditionId &&
      validId &&
      !loading &&
      !conditionFromTheGraph &&
      isConditionIdEventTriggered
    ) {
      pushError(ConditionErrors.NOT_INDEXED_ERROR)
    }

    if (
      conditionId &&
      validId &&
      !loading &&
      !conditionFromTheGraph &&
      isConditionIdEventTriggered !== null &&
      !isConditionIdEventTriggered
    ) {
      pushError(ConditionErrors.NOT_FOUND_ERROR)
    }

    if (conditionFromTheGraph) {
      setCondition(conditionFromTheGraph)
    }
  }, [
    fetchedCondition,
    isConditionIdEventTriggered,
    validId,
    loading,
    conditionId,
    pushError,
    removeError,
  ])

  React.useEffect(() => {
    removeError(ConditionErrors.NOT_RESOLVED_ERROR)
    if (condition && checkForConditionNotResolved && !condition.resolved) {
      pushError(ConditionErrors.NOT_RESOLVED_ERROR)
    }
  }, [condition, checkForConditionNotResolved, removeError, pushError])

  React.useEffect(() => {
    if (errorFetchingCondition) {
      pushError(ConditionErrors.FETCHING_ERROR)
    } else {
      removeError(ConditionErrors.FETCHING_ERROR)
    }
  }, [errorFetchingCondition, pushError, removeError])

  React.useEffect(() => {
    const locationRouterCondition = location.state?.conditionid
    if (locationRouterCondition) {
      setConditionIdCallback(locationRouterCondition)
    }
  }, [location, setConditionIdCallback])

  const value = {
    condition,
    conditionId,
    errors,
    loading: loading || isCheckingConditionIdEventTriggered,
    setConditionId: setConditionIdCallback,
    setCondition: setConditionCallback,
    isConditionIdEventTriggered,
    clearCondition,
  }

  return <ConditionContext.Provider value={value}>{props.children}</ConditionContext.Provider>
}

export const useConditionContext = (): ConditionContext => {
  return React.useContext(ConditionContext)
}
