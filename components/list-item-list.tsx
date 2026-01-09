'use client'

import { useState, useTransition } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { ListItem } from '@/types/database'
import { ListItemCard } from './list-item-card'
import { reorderListItems } from '@/app/lists/actions'

interface ListItemListProps {
  items: ListItem[]
  isOwner: boolean
  userListId: string
  maxCount: number
}

export function ListItemList({
  items: initialItems,
  isOwner,
  userListId,
  maxCount,
}: ListItemListProps) {
  const [items, setItems] = useState(initialItems)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((m) => m.id === active.id)
      const newIndex = items.findIndex((m) => m.id === over.id)

      const newItems = arrayMove(items, oldIndex, newIndex).map((m, i) => ({
        ...m,
        rank: i + 1,
      }))

      setItems(newItems)

      startTransition(async () => {
        await reorderListItems(userListId, newItems.map((m) => m.id))
      })
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
        <p className="text-gray-500">No items in this list yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {isOwner ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item) => (
              <ListItemCard
                key={item.id}
                item={item}
                isOwner={isOwner}
                userListId={userListId}
                isDraggable
              />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        items.map((item) => (
          <ListItemCard
            key={item.id}
            item={item}
            isOwner={isOwner}
            userListId={userListId}
          />
        ))
      )}
    </div>
  )
}
