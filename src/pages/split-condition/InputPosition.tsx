import React, { useEffect } from 'react'
import { FormContextValues } from 'react-hook-form'
import { useQuery } from '@apollo/react-hooks'
import {
  fetchPositionVariables,
  fetchPosition as FetchPosition,
  fetchPosition_position,
} from 'types/generatedGQL'
import { fetchPosition } from 'queries/positions'
import { BYTES_REGEX } from '../../config/constants'
import { SplitPositionForm } from './SplitCondition'

interface Props {
  splitFromPosition: boolean
  formMethods: FormContextValues<SplitPositionForm>
  onPositionChange: (position: fetchPosition_position) => void
}
export const InputPosition = ({
  splitFromPosition,
  onPositionChange,
  formMethods: { register, watch, errors, setError },
}: Props) => {
  const watchPositionId = watch('positionId')
  const errorPositionId = errors.positionId
  const skipFetchPosition = watchPositionId === '' || !splitFromPosition || !!errorPositionId

  const { data: fetchedPosition, loading, error: errorFetchingPosition } = useQuery<
    FetchPosition,
    fetchPositionVariables
  >(fetchPosition, {
    variables: { id: watchPositionId },
    skip: skipFetchPosition,
  })

  const queryUsed = !(loading || skipFetchPosition || errorFetchingPosition)

  useEffect(() => {
    if (queryUsed && fetchedPosition) {
      const { position } = fetchedPosition
      if (position) {
        onPositionChange(position)
      } else {
        setError('positionId', 'validate', "position doesn't exist")
      }
    }
  }, [fetchedPosition, onPositionChange, queryUsed, setError])

  useEffect(() => {
    if (errorFetchingPosition) {
      setError('positionId', 'validate', 'error fetching position')
    }
  }, [errorFetchingPosition, setError])

  return (
    <div>
      <input name="splitFrom" type="radio" value="position" ref={register} />

      <label>Position</label>

      <input
        name="positionId"
        type="text"
        disabled={!splitFromPosition}
        ref={register({
          required: splitFromPosition,
          pattern: BYTES_REGEX,
        })}
      ></input>
      {errorPositionId && (
        <div>
          <p>{errorPositionId.type === 'pattern' && 'Invalid bytes32 string'}</p>
          <p>{errorPositionId.type === 'validate' && errorPositionId.message}</p>
        </div>
      )}
    </div>
  )
}