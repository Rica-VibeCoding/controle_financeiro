'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export function usarScrollHorizontal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const { scrollLeft, scrollWidth, clientWidth } = container
    
    // Mais tolerante para iPhone (3px de margem para touch scrolling)
    setCanScrollLeft(scrollLeft > 3)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 3)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Verificação inicial
    updateScrollState()

    // Listener para mudanças de scroll
    container.addEventListener('scroll', updateScrollState)
    
    // Observer para mudanças de tamanho
    const resizeObserver = new ResizeObserver(updateScrollState)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', updateScrollState)
      resizeObserver.disconnect()
    }
  }, [updateScrollState])

  return {
    containerRef,
    canScrollLeft,
    canScrollRight,
    updateScrollState
  }
}