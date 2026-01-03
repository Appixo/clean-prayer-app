
const formatLocationName = (result) => {
    if (!result) return '';

    // If it's a string, it might be from storage or a fallback
    if (typeof result === 'string') {
        const parts = result.split(',').map(p => p.trim());
        if (parts.length >= 3) {
            const city = parts[0];
            const region = parts[1];
            const country = parts[2];
            if (city.toLowerCase() === region.toLowerCase()) {
                return `${city}, ${country}`;
            }
            return `${city}, ${region}, ${country}`;
        }
        return result;
    }

    const { address, display_name } = result;

    if (!address) {
        // Fallback to manual parsing if address details missing
        const parts = display_name.split(',').map((p) => p.trim());
        if (parts.length >= 3) {
            const city = parts[0];
            const region = parts[1];
            const country = parts[2];
            if (city.toLowerCase() === region.toLowerCase()) {
                return `${city}, ${country}`;
            }
            return `${city}, ${region}, ${country}`;
        }
        return display_name;
    }

    // Try to get the most specific location name (city/town/village)
    const city = address.city || address.town || address.village || address.suburb || address.hamlet || address.municipality;
    // Get the administrative region
    const province = address.state || address.province || address.region || address.county;
    const country = address.country;

    const parts = [];
    if (city) {
        parts.push(city);
    }

    // Add province if it exists and is different from the city
    if (province && (!city || province.toLowerCase() !== city.toLowerCase())) {
        parts.push(province);
    }

    if (country) {
        parts.push(country);
    }

    // If we couldn't build it from address parts, use display_name fallback
    if (parts.length === 0) {
        return display_name.split(',')[0].trim();
    }

    return parts.join(', ');
};

async function test() {
    console.log("--- Test Scenarios ---");

    // Test 1 & 2 & 3: Real data simulation
    const scenarios = [
        { name: "Utrecht (City)", query: "Utrecht&limit=5&addressdetails=1" },
        { name: "Amsterdam", query: "Amsterdam&limit=1&addressdetails=1" },
        { name: "Loenen aan de Vecht", query: "Loenen+aan+de+Vecht&limit=1&addressdetails=1" }
    ];

    for (const sc of scenarios) {
        console.log(`\nTesting ${sc.name}...`);
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${sc.query}&format=json`;
            const response = await fetch(url, { headers: { 'User-Agent': 'TestScript/1.0' } });
            const data = await response.json();

            data.forEach((item, index) => {
                const title = formatLocationName(item);
                const subtitle = item.display_name;
                console.log(`Result ${index + 1}:`);
                console.log(`  Title: ${title}`);
                console.log(`  Subtitle: ${subtitle}`);

                if (title === subtitle) {
                    console.log("  FAILED: Title and Subtitle are identical");
                }
            });
        } catch (e) {
            console.error(`Error testing ${sc.name}:`, e.message);
        }
    }
}

test();
