
async function check() {
    const url = "https://nominatim.openstreetmap.org/search?q=Utrecht&format=json&limit=5&addressdetails=1&accept-language=en";
    const resp = await fetch(url, { headers: { 'User-Agent': 'Test/1.0' } });
    const data = await resp.json();
    data.forEach(item => {
        console.log("---");
        console.log("Class:", item.class, "Type:", item.type);
        console.log("Address:", item.address);
        console.log("Display Name:", item.display_name);
    });
}
check();
