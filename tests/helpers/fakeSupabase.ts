// A tiny stand-in for the Supabase client, just enough for the save route.
// It records what the route tries to insert so tests can look at it.
export type FakeOptions = {
  user?: { id: string } | null      // who is logged in (browser cookie login)
  existing?: any                    // what the "is it already saved?" lookups find
  insertError?: any                 // make the insert fail with this error
  keyRow?: any                      // row returned for an API key lookup
  keyError?: any
}

export function fakeSupabase(opts: FakeOptions = {}) {
  const inserted: any[] = []
  const eqCalls: [string, any][] = []   // filters used on the api_keys table

  const from = (table: string) => {
    let isInsert = false
    const chain: any = {
      select: () => chain,
      eq: (col: string, val: any) => { if (table === 'api_keys') eqCalls.push([col, val]); return chain },
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
  return { client, inserted, eqCalls }
}
