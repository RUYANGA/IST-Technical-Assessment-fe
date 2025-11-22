import type { Item } from "./types"

type RequestGetter = (id: string | number) => Promise<unknown>

type ServiceLike = {
  getRequest?: RequestGetter
  fetchRequest?: RequestGetter
  getById?: RequestGetter
  fetchById?: RequestGetter
  get?: RequestGetter
  fetch?: RequestGetter
  findRequest?: RequestGetter
  [key: string]: unknown
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Load a request using the provided service.
 * Accepts several common method names and returns the result of calling the discovered getter.
 */
export async function loadRequest(svc: ServiceLike | unknown, id?: string | null) {
  if (!id) return null
  if (svc == null || typeof svc !== "object") throw new Error("Invalid service provided")

  const s = svc as ServiceLike

  const getter: RequestGetter | null =
    typeof s.getRequest === "function" ? s.getRequest.bind(s) :
    typeof s.fetchRequest === "function" ? s.fetchRequest.bind(s) :
    typeof s.getById === "function" ? s.getById.bind(s) :
    typeof s.fetchById === "function" ? s.fetchById.bind(s) :
    typeof s.get === "function" ? s.get.bind(s) :
    typeof s.fetch === "function" ? s.fetch.bind(s) :
    typeof s.findRequest === "function" ? s.findRequest.bind(s) :
    null

  if (!getter) throw new Error("Service does not support getRequest or an equivalent method")

  return await getter(id)
}

/**
 * Normalize API items into local Item shape used by the form.
 */
type ApiItem = {
  id?: unknown
  item_id?: unknown
  _id?: unknown
  name?: string
  item_name?: string
  description?: string
  note?: string
  quantity?: number | string
  qty?: number | string
  unit_price?: number | string
  price?: number | string
  unitPrice?: number | string
  [key: string]: unknown
}

export function normalizeItems(apiItems: unknown[] | undefined): Item[] {
  if (!Array.isArray(apiItems)) return []
  return apiItems.map((raw) => {
    const it = raw as ApiItem
    // prefer backend-provided id (id | item_id) so updates can reference same item
    const apiIdRaw = it.id ?? it.item_id ?? it._id ?? undefined
    const apiId = (typeof apiIdRaw === "string" || typeof apiIdRaw === "number") ? apiIdRaw : undefined
    const localId = apiId != null ? String(apiId) : makeId()
    return {
      id: localId,
      api_id: apiId,
      name: it.name ?? it.item_name ?? "",
      description: it.description ?? it.note ?? "",
      quantity: it.quantity ?? it.qty ?? 1,
      unit_price: it.unit_price ?? it.price ?? it.unitPrice ?? 0,
    }
  })
}