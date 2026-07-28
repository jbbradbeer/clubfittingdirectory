# Discovery run — OpenSEO source (Claude runbook)

For each pilot state (TX, FL, CA, AZ, GA):

1. For every metro in `discovery/metros.py` METROS[state], for each query in
   QUERIES, call the OpenSEO MCP tool `search_local_businesses` with
   query + "in {metro}, {state}". Keep total batch under 2,000 credits;
   report credit spend to the founder as you go.
2. Collect unique businesses. Map each to the raw record schema
   (see discovery/README.md): name, address, city, state_code, zip, phone,
   website, source="openseo". Missing values = "" (never null).
   Drop obvious non-fitting results (driving ranges, courses without
   a shop, repair-only) — note dropped count.
3. Write discovery/raw/openseo_{STATE}.json:
   {"state": "TX", "source": "openseo", "records": [...]}
4. Gate: `python3 discovery/validate_raw.py discovery/raw/openseo_TX.json`
   must exit 0. Fix problems before proceeding.
5. Then run dedupe: `python3 discovery/dedupe.py --state TX ...`
