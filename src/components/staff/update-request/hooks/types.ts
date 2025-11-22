export type Item = {
  id: string
  // preserve backend item id when present so we can reference it on update
  api_id?: string | number
  name?: string
  description?: string
  quantity?: number | string
  unit_price?: number | string
}

export type EditHookResult = {
  loading: boolean
  loadingDefaults: boolean
  submitting: boolean
  canSubmit: boolean
  title: string
  setTitle: (v: string) => void
  description: string
  setDescription: (v: string) => void
  items: Item[]
  addItem: () => void
  updateItem: (id: string, patch: Partial<Item>) => void
  removeItem: (id: string) => void
  requiredLevels: number | null
  setRequiredLevels: (n: number) => void
  totalAmount: string
  requestStatus: string | null
  loadError: string | null
  // return shape narrowed so callers can access .id safely
  submitUpdate: () => Promise<{ id?: string | number } | null>
}