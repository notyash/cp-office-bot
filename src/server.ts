import { app } from "./app.js"
import { env } from "./utils/env.js";
import { checkDbConnection } from "./db/pool.js";

async function main() {
    await checkDbConnection()

    app.listen(env.port, () => {
        console.log(`Server running on port: ${env.port}!`)
    })
}

main()
