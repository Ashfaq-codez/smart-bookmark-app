// A tiny stand-in for the Supabase client, just enough for the save route.
// It records what the route tries to insert so tests can look at it.
export type FakeOptions = {
  user?: { id: string } | null      // who is logged in (browser cookie login)
  existing?: any                    // what the "is it already saved?" lookups find
  insertError?: any                 // make the insert fail with this error
  keyRow?: any                      // row returned for an API key lookup
  keyError?: any
  recentCount?: number              // how many saves this user already made in the last minute
  countError?: any                  // make that count lookup fail
  updateError?: any                 // make the later page-details update fail
}

export function fakeSupabase(opts: FakeOptions = {}) {
  const inserted: any[] = []
  const updates: { patch: any; filters: [string, any][] }[] = []   // later changes made to a saved row
  const eqCalls: [string, any][] = []   // filters used on the api_keys table

  const from = (table: string) => {
    let isInsert = false
    let currentUpdate: { patch: any; filters: [string, any][] } | null = null
    const chain: any = {
      select: (_cols?: string, o?: { head?: boolean }) => {
        // The save-limit check asks for a count only: select('id', { count, head: true })
        if (o?.head) chain.then = (resolve: any) => resolve({ count: opts.recentCount ?? 0, error: opts.countError ?? null })
        return chain
      },
      gte: () => chain,
      eq: (col: string, val: any) => {
        if (table === 'api_keys') eqCalls.push([col, val])
        if (currentUpdate) currentUpdate.filters.push([col, val])
        return chain
      },
      update: (patch: any) => {
        currentUpdate = { patch, filters: [] }
        updates.push(currentUpdate)
        chain.then = (resolve: any) => resolve({ error: opts.updateError ?? null })
        return chain
      },
      in: () => chain,
      or: () => chain,
      ilike: () => chain,
      limit: () => chain,
      insert: (rows: any[]) => { isInsert = true; inserted.push(...rows); return chain },
      maybeSingle: async () => ({ data: opts.existing ?? null, error: null }),
      single: async () => {
        if (table === 'api_keys') return { data: opts.keyRow ?? null, error: opts.keyError ?? null }
        if (isInsert) {
          return opts.insertError
            ? { data: null, error: opts.insertError }
            : { data: { id: 1, ...inserted[inserted.length - 1] }, error: null }
        }
        return { data: null, error: null }
      },
    }
    return chain
  }

  const client = {
    from,
    auth: { getUser: async () => ({ data: { user: opts.user ?? null }, error: null }) },
  }
  return { client, inserted, updates, eqCalls }
}
