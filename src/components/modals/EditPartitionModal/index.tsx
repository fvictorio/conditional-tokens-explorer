import React, { useCallback, useState } from 'react'
import styled, { withTheme } from 'styled-components'

import { OutcomeProps } from '../../../util/types'
import { Button } from '../../buttons/Button'
import { ButtonAdd } from '../../buttons/ButtonAdd'
import {
  ButtonBulkMove,
  ButtonBulkMoveActions,
  ButtonBulkMoveDirection,
} from '../../buttons/ButtonBulkMove'
import { ButtonControl, ButtonControlType } from '../../buttons/ButtonControl'
import { Modal, ModalProps } from '../../common/Modal'
import {
  AddableOutcome,
  DraggableOutcome,
  PlaceholderOutcome,
  RemovableOutcome,
} from '../../partitions/Outcome'
import { ButtonContainer } from '../../pureStyledComponents/ButtonContainer'
import { CardSubtitle } from '../../pureStyledComponents/CardSubtitle'
import { CardText } from '../../pureStyledComponents/CardText'
import { OutcomesContainer } from '../../pureStyledComponents/OutcomesContainer'
import {
  StripedList,
  StripedListEmpty,
  StripedListItemLessPadding,
} from '../../pureStyledComponents/StripedList'
import { TitleControlButton } from '../../pureStyledComponents/TitleControl'
import { InfoCard } from '../../statusInfo/InfoCard'
import { InlineLoading } from '../../statusInfo/InlineLoading'
import { TitleValue } from '../../text/TitleValue'

const Collection = styled(StripedListItemLessPadding)`
  flex-wrap: nowrap;

  &.dragOver {
    background-color: rgba(0, 156, 180, 0.15);
  }
`

const EditableOutcomesWrapper = styled.div`
  align-items: center;
  display: grid;
  grid-column-gap: 12px;
  grid-template-columns: 1fr 46px;
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`

const EditableOutcomes = styled.div<{
  borderBottomColor?: string
  fullBorderColor?: string
}>`
  align-items: center;
  background-color: #fff;
  border-bottom-color: ${(props) => props.borderBottomColor};
  border-left-color: transparent;
  border-right-color: transparent;
  border-style: solid;
  border-top-color: transparent;
  border-width: 2px;
  display: flex;
  flex-grow: 1;
  min-height: 45px;
  padding: 6px 8px;
  transition: all 0.15s ease-out;

  ${(props) => props.fullBorderColor && `border-radius: 8px;`}

  ${(props) => props.fullBorderColor && `border-color: ${props.fullBorderColor};`}
`

EditableOutcomes.defaultProps = {
  borderBottomColor: '#b2b5b2',
}

const OutcomesInner = styled(OutcomesContainer)`
  flex-grow: 1;
  height: 100%;
  margin: 0 15px 0 0;
`

const TitleValueExtraMargin = styled(TitleValue)`
  margin-bottom: 40px;
`

const CardTextPlaceholder = styled(CardText)`
  flex-grow: 1;
  margin: 0 15px 0 0;
  opacity: 0.7;
`

const ButtonBulk = styled(ButtonBulkMove)`
  margin-top: auto;
`

const ButtonAddNewCollection = styled(ButtonAdd)`
  border-width: 4px;
  border-style: solid;
  margin-top: auto;
  box-sizing: content-box;

  &,
  &:hover,
  &[disabled],
  &[disabled]:hover {
    border-color: #fff;
  }
`

interface DraggedOutcomeProps extends OutcomeProps {
  collectionFromIndex: number
  outcomeIndex: number
}

interface EditPartitionModalProps extends ModalProps {
  outcomes: Array<any>
  theme?: any
}

const PartitionModal: React.FC<EditPartitionModalProps> = (props) => {
  const { onRequestClose, outcomes, theme, ...restProps } = props
  const dragOverClass = 'dragOver'
  const draggingClass = 'isDragging'
  const placeholderOutcomeId = 'placeholderOutcome'
  const outcomesByRow = '13'

  const [allCollections, setAllCollections] = useState<any>(outcomes)
  const [newCollection, setNewCollection] = useState<any>([])
  const [availableOutcomes, setAvailableOutcomes] = useState<any>([])
  const [draggedOutcome, setDraggedOutcome] = useState<DraggedOutcomeProps | null>(null)

  const resetClassName = (e: any, className: string) =>
    e.currentTarget.className.replace(className, '')

  const removeOutcomeFromCollection = useCallback(
    (collectionIndex: number, outcomeIndex: number) => {
      setAvailableOutcomes([...availableOutcomes, allCollections[collectionIndex][outcomeIndex]])

      allCollections[collectionIndex].splice(outcomeIndex, 1)

      setAllCollections([
        ...allCollections.filter((item: any) => {
          return item.length > 0
        }),
      ])
    },
    [availableOutcomes, allCollections]
  )

  const onDragStart = useCallback(
    (e: any, collectionFromIndex: number, outcome: OutcomeProps, outcomeIndex: number) => {
      const placeholderOutcome = document.getElementById(placeholderOutcomeId)

      if (e.currentTarget.className.search(draggingClass) === -1) {
        e.currentTarget.className = `${e.currentTarget.className} ${draggingClass}`
      }

      setDraggedOutcome({
        collectionFromIndex: collectionFromIndex,
        id: outcome.id,
        outcomeIndex: outcomeIndex,
        value: outcome.value,
      })

      if (placeholderOutcome) {
        e.dataTransfer.setDragImage(document.getElementById(placeholderOutcomeId), 20, 20)
      }
    },
    []
  )

  const onDragEnd = useCallback((e: any) => {
    e.currentTarget.className = resetClassName(e, draggingClass)
  }, [])

  const onDragOver = useCallback(
    (e: any, collectionToIndex: number) => {
      e.preventDefault()

      if (draggedOutcome === null || collectionToIndex === draggedOutcome.collectionFromIndex)
        return

      if (e.currentTarget.className.search(dragOverClass) === -1) {
        e.currentTarget.className = `${e.currentTarget.className} ${dragOverClass}`
      }
    },
    [draggedOutcome]
  )

  const onDrop = useCallback(
    (e: any, collectionToIndex: number) => {
      e.currentTarget.className = resetClassName(e, dragOverClass)

      if (draggedOutcome === null || collectionToIndex === draggedOutcome.collectionFromIndex)
        return

      allCollections[draggedOutcome.collectionFromIndex].splice(draggedOutcome.outcomeIndex, 1)
      allCollections[collectionToIndex].push({ value: draggedOutcome.value, id: draggedOutcome.id })
      setAllCollections([...allCollections.filter((collection: any) => collection.length > 0)])
    },
    [allCollections, draggedOutcome]
  )

  const onDragLeave = useCallback((e: any) => {
    e.currentTarget.className = resetClassName(e, dragOverClass)
  }, [])

  const addOutcomeToNewCollection = useCallback(
    (outcomeIndex: number) => {
      setNewCollection([...newCollection, availableOutcomes[outcomeIndex]])
      availableOutcomes.splice(outcomeIndex, 1)
    },
    [newCollection, availableOutcomes]
  )

  const removeOutcomeFromNewCollection = useCallback(
    (outcomeIndex: number) => {
      setAvailableOutcomes([...availableOutcomes, newCollection[outcomeIndex]])
      newCollection.splice(outcomeIndex, 1)
    },
    [newCollection, availableOutcomes]
  )

  const addNewCollection = useCallback(() => {
    setAllCollections([[...newCollection], ...allCollections])
    newCollection.length = 0
  }, [newCollection, allCollections])

  const addAllAvailableOutcomesToNewCollection = useCallback(() => {
    setNewCollection([...newCollection, ...availableOutcomes])
    availableOutcomes.length = 0
  }, [availableOutcomes, newCollection])

  const clearOutcomesFromNewCollection = useCallback(() => {
    setAvailableOutcomes([...availableOutcomes, ...newCollection])
    newCollection.length = 0
  }, [availableOutcomes, newCollection])

  const removeAllCollections = useCallback(() => {
    const newAvailableOutcomes: Array<any> = []

    allCollections.forEach((item: Array<OutcomeProps>) => {
      item.forEach((subitem: OutcomeProps) => {
        newAvailableOutcomes.push(subitem)
      })
    })

    setAvailableOutcomes([...availableOutcomes, ...newAvailableOutcomes])
    allCollections.length = 0
  }, [allCollections, availableOutcomes])

  const removeCollection = useCallback(
    (collectionIndex: number) => {
      setAvailableOutcomes([...availableOutcomes, ...allCollections[collectionIndex]])
      allCollections[collectionIndex].length = 0
      setAllCollections([
        ...allCollections.filter((collection: Array<OutcomeProps>) => collection.length > 0),
      ])
    },
    [availableOutcomes, allCollections]
  )

  const [removeAll, setRemoveAll] = useState(undefined)
  const [addAll, setAddAll] = useState(undefined)

  const notEnoughCollections = allCollections.length < 2
  const orphanedOutcomes = availableOutcomes.length > 0 || newCollection.length > 0
  const disableButton = notEnoughCollections || orphanedOutcomes

  return (
    <Modal onRequestClose={onRequestClose} title="Edit Partition" {...restProps}>
      <TitleValueExtraMargin
        title="New Collection"
        value={
          <>
            <CardSubtitle>Outcomes</CardSubtitle>
            <EditableOutcomesWrapper>
              <EditableOutcomes
                borderBottomColor={theme.colors.mediumGrey}
                fullBorderColor={addAll}
                // onMouseLeave={() => setAddAll(undefined)}
              >
                {availableOutcomes.length ? (
                  <OutcomesInner columnGap="8px" columns="12" rowGap="8px">
                    {availableOutcomes.map((outcome: OutcomeProps, outcomeIndex: number) => {
                      return (
                        <AddableOutcome
                          key={outcomeIndex}
                          onClick={() => {
                            addOutcomeToNewCollection(outcomeIndex)
                          }}
                          outcome={outcome.value}
                        />
                      )
                    })}
                  </OutcomesInner>
                ) : (
                  <CardTextPlaceholder>
                    Outcomes removed from collections will be available here.
                  </CardTextPlaceholder>
                )}
                <ButtonBulk
                  action={ButtonBulkMoveActions.add}
                  direction={ButtonBulkMoveDirection.down}
                  disabled={availableOutcomes.length === 0}
                  onClick={() => {
                    addAllAvailableOutcomesToNewCollection()
                    setAddAll(undefined)
                  }}
                  onMouseEnter={() => setAddAll(theme.colors.primary)}
                  onMouseLeave={() => setAddAll(undefined)}
                />
              </EditableOutcomes>
            </EditableOutcomesWrapper>
            <CardSubtitle>New Collection Preview</CardSubtitle>
            <EditableOutcomesWrapper>
              <EditableOutcomes
                borderBottomColor={theme.colors.primary}
                fullBorderColor={removeAll}
                // onMouseLeave={() => setRemoveAll(undefined)}
              >
                {newCollection.length ? (
                  <OutcomesInner columnGap="8px" columns="12" rowGap="8px">
                    {newCollection.map((outcome: OutcomeProps, outcomeIndex: number) => {
                      return (
                        <RemovableOutcome
                          key={outcomeIndex}
                          onClick={() => {
                            removeOutcomeFromNewCollection(outcomeIndex)
                          }}
                          outcome={outcome.value}
                        />
                      )
                    })}
                  </OutcomesInner>
                ) : (
                  <CardTextPlaceholder>
                    Add at least one outcome to create a new collection.
                  </CardTextPlaceholder>
                )}
                <ButtonBulk
                  action={ButtonBulkMoveActions.remove}
                  direction={ButtonBulkMoveDirection.up}
                  disabled={newCollection.length === 0}
                  onClick={() => {
                    clearOutcomesFromNewCollection()
                    setRemoveAll(undefined)
                  }}
                  onMouseEnter={() => setRemoveAll(theme.colors.error)}
                  onMouseLeave={() => setRemoveAll(undefined)}
                />
              </EditableOutcomes>
              <ButtonAddNewCollection
                disabled={newCollection.length === 0}
                onClick={() => {
                  addNewCollection()
                }}
              />
            </EditableOutcomesWrapper>
          </>
        }
      />
      <TitleValue
        title="Collections"
        titleControl={
          <TitleControlButton disabled={allCollections.length === 0} onClick={removeAllCollections}>
            Delete All
          </TitleControlButton>
        }
        value={
          <>
            <CardText>
              You can drag outcomes across collections. Click on an outcome to remove it.
            </CardText>
            <StripedList minHeight="200px">
              {allCollections.length > 0 ? (
                allCollections.map((outcomeList: Array<OutcomeProps>, collectionIndex: number) => {
                  return (
                    <Collection
                      key={collectionIndex}
                      onDragLeave={onDragLeave}
                      onDragOver={(e) => onDragOver(e, collectionIndex)}
                      onDrop={(e) => onDrop(e, collectionIndex)}
                    >
                      <OutcomesInner columnGap="0" columns="13">
                        {outcomeList.map((outcome: OutcomeProps, outcomeIndex: number) => (
                          <DraggableOutcome
                            key={outcomeIndex}
                            lastInRow={outcomesByRow}
                            makeDraggable
                            onClick={() => {
                              removeOutcomeFromCollection(collectionIndex, outcomeIndex)
                            }}
                            onDragEnd={onDragEnd}
                            onDragStart={(e: any) => {
                              onDragStart(e, collectionIndex, outcome, outcomeIndex)
                            }}
                            outcome={outcome.value}
                          />
                        ))}
                      </OutcomesInner>
                      <ButtonControl
                        buttonType={ButtonControlType.delete}
                        onClick={() => {
                          removeCollection(collectionIndex)
                        }}
                      />
                    </Collection>
                  )
                })
              ) : (
                <StripedListEmpty>No collections.</StripedListEmpty>
              )}
            </StripedList>
          </>
        }
      />
      <ButtonContainer>
        <Button disabled={disableButton} onClick={onRequestClose}>
          Save
        </Button>
      </ButtonContainer>
      <PlaceholderOutcome
        id={placeholderOutcomeId}
        outcome={(draggedOutcome && draggedOutcome.value.toString()) || ''}
      />
    </Modal>
  )
}

export const EditPartitionModal = withTheme(PartitionModal)
