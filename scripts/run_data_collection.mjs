const endpoint = process.env.MEDISYN_COLLECT_ENDPOINT || "http://localhost:3000/api/data/collect"

async function run() {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })

  const payload = await response.json()

  if (!response.ok || payload.ok === false) {
    console.error("Data collection failed:", payload)
    process.exit(1)
  }

  console.log("Data collection completed")
  console.log("Generated at:", payload.generatedAt)
  console.log("Summary:", payload.summary)
  console.log("Files:", payload.files)
}

run().catch((error) => {
  console.error("Unexpected error:", error)
  process.exit(1)
})
