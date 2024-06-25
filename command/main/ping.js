export default {
    command: ["ping"], 
    description: "Cek speedtest ping status",
    name: "ping",
    tags: "main", 
    
    run: async (m) => {
        const moment = (await import("moment-timezone")).default
        const calculatePing = function (timestamp, now) {
        	return moment.duration(now - moment(timestamp * 1000)).asSeconds();
        }
        m.reply(`*Ping :* *_${calculatePing(m.timestamp, Date.now())} second(s)_*`)
    }
}