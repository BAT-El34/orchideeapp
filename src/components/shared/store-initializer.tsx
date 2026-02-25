'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/stores/app-store'
import type { User, Entity } from '@/types'

interface StoreInitializerProps {
  user: User
  entity: Entity | null
}

export function StoreInitializer({ user, entity }: StoreInitializerProps) {
  const setUser = useAppStore((s) => s.setUser)
  const setEntity = useAppStore((s) => s.setEntity)

  useEffect(() => {
    setUser(user)
    setEntity(entity)
  }, [user, entity, setUser, setEntity])

  return null
}
