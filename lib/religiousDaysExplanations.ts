export interface ReligiousDayExplanation {
    name: string;
    description: string;
    significance: string;
}

export const religiousDayExplanations: Record<string, ReligiousDayExplanation> = {
    'Üç Ayların Başlangıcı': {
        name: 'Üç Ayların Başlangıcı',
        description: 'Recep, Şaban ve Ramazan ayları İslam dininde özel öneme sahip üç aydır. Bu aylar ibadet, dua ve hayır işleri için önemli zamanlardır.',
        significance: 'Bu aylar, Müslümanlar için manevi hazırlık ve ibadet dönemidir. Özellikle Ramazan ayına hazırlık için önemli bir başlangıçtır.'
    },
    'Regaip Kandili': {
        name: 'Regaip Kandili',
        description: 'Recep ayının ilk Cuma gecesi olan Regaip Kandili, "rağbet edilen, arzu edilen gece" anlamına gelir. Bu gece duaların kabul edildiği özel bir gecedir.',
        significance: 'Regaip Kandili, üç ayların başlangıcı olarak kabul edilir ve Müslümanlar için önemli bir ibadet gecesidir. Bu gecede namaz kılmak, dua etmek ve Kur\'an okumak çok sevaptır.'
    },
    'Miraç Kandili': {
        name: 'Miraç Kandili',
        description: 'Miraç, Hz. Muhammed\'in (s.a.v.) göğe yükselmesi ve Allah ile buluşması olayıdır. Bu gece Recep ayının 27. gecesidir.',
        significance: 'Miraç gecesi, İslam tarihinin en önemli olaylarından biridir. Bu gecede beş vakit namaz farz kılınmıştır. Müslümanlar bu geceyi ibadetle geçirirler.'
    },
    'Berat Kandili': {
        name: 'Berat Kandili',
        description: 'Şaban ayının 15. gecesi olan Berat Kandili, "beraat" yani "kurtuluş" anlamına gelir. Bu gece günahlardan arınma ve bağışlanma gecesidir.',
        significance: 'Berat Kandili\'nde Allah\'ın rahmeti ve mağfireti geniş bir şekilde tecelli eder. Bu gece duaların kabul edildiği, günahların bağışlandığı özel bir gecedir.'
    },
    'Ramazan Başlangıcı': {
        name: 'Ramazan Başlangıcı',
        description: 'Ramazan ayı, İslam\'ın beş şartından biri olan oruç ibadetinin yapıldığı kutsal aydır. Bu ay boyunca Müslümanlar gündüzleri oruç tutarlar.',
        significance: 'Ramazan ayı, Kur\'an-ı Kerim\'in indirildiği aydır. Bu ay boyunca oruç tutmak, Kur\'an okumak, sadaka vermek ve ibadet etmek çok sevaptır.'
    },
    'Kadir Gecesi': {
        name: 'Kadir Gecesi',
        description: 'Kadir Gecesi, Ramazan ayının 27. gecesidir. Kur\'an-ı Kerim bu gecede indirilmeye başlanmıştır. "Bin aydan daha hayırlı" olarak nitelendirilir.',
        significance: 'Kadir Gecesi, İslam\'ın en kutsal gecelerinden biridir. Bu geceyi ibadetle geçirmek, bin aylık ibadetten daha fazla sevap kazandırır. Kur\'an okumak, namaz kılmak ve dua etmek çok önemlidir.'
    },
    'Ramazan Bayramı 1. Gün': {
        name: 'Ramazan Bayramı (Şeker Bayramı)',
        description: 'Ramazan Bayramı, Ramazan ayının sonunda üç gün süren bir bayramdır. İlk günü en önemli gündür ve bayram namazı kılınır.',
        significance: 'Ramazan Bayramı, oruç ayının tamamlanmasının kutlandığı sevinçli bir gündür. Bayram namazı kılmak, akraba ve komşuları ziyaret etmek, çocuklara hediyeler vermek ve sadaka vermek sünnettir.'
    },
    'Ramazan Bayramı 2. Gün': {
        name: 'Ramazan Bayramı 2. Gün',
        description: 'Ramazan Bayramı\'nın ikinci günü, bayramın devamıdır. Bu günlerde ziyaretler, ikramlar ve hayır işleri yapılır.',
        significance: 'Bayram günleri, Müslümanlar arasında sevgi, saygı ve dayanışmanın pekiştirildiği özel günlerdir.'
    },
    'Ramazan Bayramı 3. Gün': {
        name: 'Ramazan Bayramı 3. Gün',
        description: 'Ramazan Bayramı\'nın üçüncü ve son günüdür. Bayram kutlamaları bu günle sona erer.',
        significance: 'Bayram günleri, aile ve toplum bağlarının güçlendirildiği, sevinç ve mutluluğun paylaşıldığı günlerdir.'
    },
    'Arife': {
        name: 'Arife Günü',
        description: 'Arife, Kurban Bayramı\'ndan bir gün önceki gündür. Bu gün, bayram hazırlıklarının yapıldığı ve ibadetlerin artırıldığı önemli bir gündür.',
        significance: 'Arife günü, oruç tutmak çok sevaptır. Bu gün duaların kabul edildiği, günahların bağışlandığı özel bir gündür.'
    },
    'Kurban Bayramı 1. Gün': {
        name: 'Kurban Bayramı',
        description: 'Kurban Bayramı, Hac ibadetinin yapıldığı Zilhicce ayının 10. günü başlar ve dört gün sürer. İlk günü en önemli gündür ve bayram namazı kılınır.',
        significance: 'Kurban Bayramı, Hz. İbrahim\'in oğlu İsmail\'i kurban etmek istemesi ve Allah\'ın bir koç göndermesi olayını hatırlatır. Bu bayramda kurban kesmek, bayram namazı kılmak ve sadaka vermek önemlidir.'
    },
    'Kurban Bayramı 2. Gün': {
        name: 'Kurban Bayramı 2. Gün',
        description: 'Kurban Bayramı\'nın ikinci günü, bayramın devamıdır. Bu günlerde kurban kesimi devam eder.',
        significance: 'Kurban Bayramı, Allah\'a yakınlaşma, şükür ve paylaşma bayramıdır.'
    },
    'Kurban Bayramı 3. Gün': {
        name: 'Kurban Bayramı 3. Gün',
        description: 'Kurban Bayramı\'nın üçüncü günüdür. Bayram kutlamaları ve kurban kesimi devam eder.',
        significance: 'Kurban Bayramı, Müslümanlar arasında dayanışma ve paylaşmanın en güzel örneklerinden biridir.'
    },
    'Kurban Bayramı 4. Gün': {
        name: 'Kurban Bayramı 4. Gün',
        description: 'Kurban Bayramı\'nın dördüncü ve son günüdür. Bayram bu günle sona erer.',
        significance: 'Kurban Bayramı, Allah\'a şükür ve yakınlaşma için önemli bir fırsattır.'
    },
    'Hicri Yılbaşı': {
        name: 'Hicri Yılbaşı',
        description: 'Hicri takvimin ilk ayı olan Muharrem ayının birinci günü, Hicri yılbaşıdır. Bu, Hz. Muhammed\'in (s.a.v.) Mekke\'den Medine\'ye hicretinin başlangıcıdır.',
        significance: 'Hicri yılbaşı, İslam tarihinin başlangıcı olarak kabul edilir. Bu gün, Müslümanlar için yeni bir yılın başlangıcıdır.'
    },
    'Aşure Günü': {
        name: 'Aşure Günü',
        description: 'Aşure Günü, Muharrem ayının 10. günüdür. Bu gün, birçok önemli olayın gerçekleştiği özel bir gündür.',
        significance: 'Aşure Günü, Hz. Nuh\'un gemisinin karaya çıktığı, Hz. Musa\'nın Firavun\'dan kurtulduğu ve Hz. Hüseyin\'in şehit edildiği gündür. Bu gün oruç tutmak sünnettir ve aşure tatlısı yapılır.'
    },
    'Mevlid Kandili': {
        name: 'Mevlid Kandili',
        description: 'Mevlid Kandili, Hz. Muhammed\'in (s.a.v.) doğum günü olarak kabul edilen gecedir. Rebiülevvel ayının 12. gecesidir.',
        significance: 'Mevlid Kandili, Peygamberimizin dünyaya gelişinin kutlandığı özel bir gecedir. Bu gece, O\'nun hayatını okumak, salavat getirmek ve ibadet etmek çok sevaptır.'
    }
};

export function getReligiousDayExplanation(dayName: string): ReligiousDayExplanation | undefined {
    // Handle variations in naming
    const normalizedName = dayName
        .replace(/\s+\d+\.\s+Gün$/, '') // Remove "1. Gün", "2. Gün" etc.
        .trim();
    
    // Try exact match first
    if (religiousDayExplanations[normalizedName]) {
        return religiousDayExplanations[normalizedName];
    }
    
    // Try partial match for bayram days
    if (normalizedName.includes('Ramazan Bayramı')) {
        return religiousDayExplanations['Ramazan Bayramı 1. Gün'];
    }
    if (normalizedName.includes('Kurban Bayramı')) {
        return religiousDayExplanations['Kurban Bayramı 1. Gün'];
    }
    
    return undefined;
}
