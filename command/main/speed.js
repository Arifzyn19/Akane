import { exec } from "child_process"

export default {
    command: ["speed", "speedtest"], 
    description: "Cek speedtest status",
    name: "speed",
    tags: "main", 
    
    run: async (m) => {
        const { promisify } = (await import("util"));
        const cp = (await import("child_process")).default;
        let execute = promisify(exec).bind(cp);
        
        m.reply("Testing Speed...");
        
        let result;
        try {
            result = await execute(`speedtest --accept-license`);
        } catch (error) {
            return m.reply(`Error: ${error.message}`);
        }

        const { stdout, stderr } = result;
        
        if (stdout) {
            return m.reply(stdout);
        }

        if (stderr) {
            return m.reply(stderr);
        }
    }
}