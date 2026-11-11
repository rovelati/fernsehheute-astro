/**
 * Channel Editorial Profiles & Tailored FAQs
 *
 * Provides unique editorial text, broadcaster history, target audience details
 * and channel-specific FAQs for TV channels to eliminate boilerplate content
 * and permanently resolve Google's "Crawled - currently not indexed" status.
 */

export interface ChannelEditorial {
  summary: string;
  focus: string;
  signatureShows?: string[];
  broadcaster: string;
  headquarters?: string;
  streamInfo: string;
  faqs: { question: string; answer: string }[];
}

const TOP_EDITORIAL: Record<string, ChannelEditorial> = {
  'das-erste': {
    summary: 'Das Erste ist das öffentlich-rechtliche Hauptprogramm der ARD (Arbeitsgemeinschaft der öffentlich-rechtlichen Rundfunkanstalten der Bundesrepublik Deutschland). Als ältester deutscher Fernsehsender steht Das Erste für verlässliche Nachrichten, investigativen Journalismus, preisgekrönte Fernsehfilme und hochkarätige Sportereignisse.',
    focus: 'Nachrichten, gesellschaftliche Information, Dokumentationen, Serienklassiker und deutscher Spielfilm.',
    signatureShows: ['Tagesschau', 'Tatort', 'Sportschau', 'Tagesthemen', 'Rote Rosen', 'Sturm der Liebe'],
    broadcaster: 'ARD (Arbeitsgemeinschaft der Rundfunkanstalten)',
    headquarters: 'München (Programmdirektion)',
    streamInfo: 'Kostenfrei und in HD über die offizielle ARD Mediathek sowie via Livestream auf ardmediathek.de abrufbar.',
    faqs: [
      {
        question: 'Wann beginnen die Hauptnachrichten und die Prime Time auf Das Erste?',
        answer: 'Die Tagesschau startet täglich pünktlich um 20:00 Uhr. Im Anschluss beginnt um 20:15 Uhr das Hauptabendprogramm mit Spielfilmen, Shows oder dem traditionsreichen Sonntagskrimi Tatort.',
      },
      {
        question: 'Wie kann man Das Erste live empfangen oder streamen?',
        answer: 'Das Erste wird unverschlüsselt über Satellit (ASTRA 19.2° Ost), digitales Kabel (DVB-C), Antenne (DVB-T2 HD) sowie als 24/7 Livestream in der ARD Mediathek ausgestrahlt.',
      },
      {
        question: 'Gibt es verpasste Sendungen von Das Erste auf Abruf?',
        answer: 'Nahezu alle eigenproduzierten Filme, Serien, Dokumentationen und Nachrichtensendungen stehen nach Ausstrahlung mindestens 30 Tage lang kostenlos in der ARD Mediathek zum Abruf bereit.',
      },
    ],
  },

  'zdf': {
    summary: 'Das ZDF (Zweites Deutsches Fernsehen) mit Sitz in Mainz ist eine der größten öffentlich-rechtlichen Sendeanstalten Europas. Das Vollprogramm zeichnet sich durch erstklassige Informationssendungen, gesellschaftskritische Satire, packende Kriminalreihen sowie quotenstarke Unterhaltungsshows aus.',
    focus: 'Nachrichten, investigative Magazine, politische Satire, Krimireihen und Unterhaltung.',
    signatureShows: ['heute-journal', 'ZDF Magazin Royale', 'heute-show', 'Der Bergdoktor', 'Ein starkes Team', 'Terra X'],
    broadcaster: 'ZDF Anstalt des öffentlichen Rechts',
    headquarters: 'Mainz',
    streamInfo: 'Kostenfrei im HD-Livestream und in der ZDFmediathek über Web, Smart-TV-Apps und mobile Geräte verfügbar.',
    faqs: [
      {
        question: 'Wann laufen die wichtigsten Informationssendungen im ZDF?',
        answer: 'Die Hauptausgabe von "heute" läuft um 19:00 Uhr, gefolgt vom ausführlichen Hintergrundmagazin "heute-journal" meist gegen 21:45 Uhr.',
      },
      {
        question: 'Welche Highlights zeigt das ZDF heute Abend um 20:15 Uhr?',
        answer: 'Um 20:15 Uhr bietet das ZDF je nach Wochentag Primetime-Krimis (z.B. Bella Block, Wilsberg), herzerwärmende Familienserien am Donnerstag, große Samstagabendshows oder Natur- und Geschichtsdokumentationen von Terra X am Sonntag.',
      },
      {
        question: 'Wo kann man das ZDF live streamen?',
        answer: 'Das ZDF lässt sich rund um die Uhr kostenlos und ohne Registrierung auf zdf.de/live-tv sowie in der ZDFmediathek-App streamen.',
      },
    ],
  },

  'rtl': {
    summary: 'RTL ist der reichweitenstärkste Privatsender Deutschlands und das Flaggschiff der RTL Group mit Sitz in Köln. Der Sender prägt seit Jahrzehnten die deutsche Fernsehlandschaft mit großen Samstagabend-Shows, tagesaktuellen Boulevard-Magazinen, Daily Soaps und Reality-TV-Formaten.',
    focus: 'Unterhaltung, Live-Shows, Daily Soaps, Reality-TV, Nachrichten und Sportevents.',
    signatureShows: ['Wer wird Millionär?', 'Let\'s Dance', 'Gute Zeiten, schlechte Zeiten (GZSZ)', 'Ich bin ein Star – Holt mich hier raus!', 'RTL Aktuell'],
    broadcaster: 'RTL Deutschland GmbH',
    headquarters: 'Köln',
    streamInfo: 'Über die offizielle Streaming-Plattform RTL+ (Web & App) im Livestream und auf Abruf verfügbar.',
    faqs: [
      {
        question: 'Welche Sendungen laufen zur Prime Time um 20:15 Uhr auf RTL?',
        answer: 'RTL zeigt um 20:15 Uhr große Unterhaltungsformate wie Let\'s Dance, Wer wird Millionär? mit Günther Jauch, DSDS, Ninja Warrior Germany oder aktuelle Reality-Hits.',
      },
      {
        question: 'Wo kann man RTL im Internet live schauen?',
        answer: 'RTL kann über den Streaming-Dienst RTL+ im Live-Stream geschaut werden. Zudem ist der Sender über alle gängigen TV-Streaming-Dienste wie waipu.tv und Zattoo empfangbar.',
      },
      {
        question: 'Wann läuft GZSZ (Gute Zeiten, schlechte Zeiten)?',
        answer: 'GZSZ wird montags bis freitags von 19:40 Uhr bis 20:15 Uhr im RTL-Vorabendprogramm ausgestrahlt.',
      },
    ],
  },

  'sat1': {
    summary: 'SAT.1 ist einer der traditionsreichsten deutschen Privatsender und Kernmarke der ProSiebenSat.1 Media SE. Bekannt für sein erfolgreiches SAT.1-Frühstücksfernsehen, emotionale Shows, Kochduelle und Reality-Formate bietet SAT.1 ein breites Unterhaltungsangebot für die ganze Familie.',
    focus: 'Familienunterhaltung, Shows, Kochformate, US-Crimeserien und Frühstücksfernsehen.',
    signatureShows: ['SAT.1-Frühstücksfernsehen', 'The Voice of Germany', 'Das große Backen', 'Promi Big Brother', 'Navy CIS'],
    broadcaster: 'ProSiebenSat.1 TV Deutschland GmbH',
    headquarters: 'Unterföhring bei München',
    streamInfo: 'Kostenlos im Joyn-Livestream und in der Joyn-Mediathek verfügbar.',
    faqs: [
      {
        question: 'Wann sendet das SAT.1-Frühstücksfernsehen?',
        answer: 'Das SAT.1-Frühstücksfernsehen begleitet Zuschauer werktags von 05:30 Uhr bis 10:00 Uhr mit aktuellen Nachrichten, Servicethemen und Promi-News.',
      },
      {
        question: 'Was läuft heute um 20:15 Uhr auf SAT.1?',
        answer: 'Zur Prime Time um 20:15 Uhr zeigt SAT.1 beliebte Show-Formate wie The Voice of Germany, Das große Backen, emotionale Filme oder spannende US-Krimiserien.',
      },
      {
        question: 'Wie kann man SAT.1 kostenlos online streamen?',
        answer: 'SAT.1 lässt sich ohne Abonnement im Joyn-Livestream (joyn.de) über Browser, mobile Apps und Smart-TV-Geräte verfolgen.',
      },
    ],
  },

  'prosieben': {
    summary: 'ProSieben ist der innovative Unterhaltungssender für ein junges und junggebliebenes Publikum. Mit Blockbuster-Premieren, Comedy-Serien, Wissensmagazinen und spektakulären Live-Shows mit Joko & Klaas setzt ProSieben Maßstäbe in der deutschen Primetime.',
    focus: 'Hollywood-Blockbuster, Event-Shows, Infotainment, US-Sitcoms und Comedy.',
    signatureShows: ['Galileo', 'Joko & Klaas gegen ProSieben', 'The Masked Singer', 'Germany\'s Next Topmodel (GNTM)', 'The Big Bang Theory'],
    broadcaster: 'ProSiebenSat.1 TV Deutschland GmbH',
    headquarters: 'Unterföhring bei München',
    streamInfo: 'Im kostenlosen Livestream über die Plattform Joyn auf allen Geräten abrufbar.',
    faqs: [
      {
        question: 'Wann läuft das Wissensmagazin Galileo auf ProSieben?',
        answer: 'Galileo läuft montags bis freitags täglich im Vorabendprogramm von 19:05 Uhr bis 20:15 Uhr.',
      },
      {
        question: 'Welche Shows zeigt ProSieben zur Hauptsendezeit um 20:15 Uhr?',
        answer: 'Um 20:15 Uhr präsentiert ProSieben große Unterhaltungs-Events wie Wer stiehlt mir die Show?, The Masked Singer, GNTM oder Free-TV-Premieren internationaler Kinofilme.',
      },
      {
        question: 'Wo ist ProSieben live im Stream zu sehen?',
        answer: 'ProSieben kann auf joyn.de sowie in der Joyn-App kostenfrei und live geschaut werden.',
      },
    ],
  },

  'vox': {
    summary: 'VOX ist der Wohlfühlsender der RTL Group mit Fokus auf Kochduelle, Gründershows, Tierformate und erstklassige Doku-Soaps. Sendungen wie "Die Höhle der Löwen" oder "Kitchen Impossible" stehen für hochwertige Eigenproduktionen mit starker Zuschauerbindung.',
    focus: 'Kulinarik, Gründerkultur, Doku-Soaps, Lifestyle und internationale Spielfilme.',
    signatureShows: ['Die Höhle der Löwen', 'Kitchen Impossible', 'Das perfekte Dinner', 'First Dates', 'Shopping Queen'],
    broadcaster: 'RTL Deutschland GmbH',
    headquarters: 'Köln',
    streamInfo: 'Im Livestream und als Mediathek über RTL+ abrufbar.',
    faqs: [
      {
        question: 'Wann läuft Das perfekte Dinner auf VOX?',
        answer: 'Das perfekte Dinner wird montags bis freitags jeweils von 19:00 Uhr bis 20:15 Uhr ausgestrahlt.',
      },
      {
        question: 'Was läuft heute Abend um 20:15 Uhr auf VOX?',
        answer: 'Zur Prime Time zeigt VOX preisgekrönte Formate wie Die Höhle der Löwen, Sing meinen Song, Kitchen Impossible oder große Hollywood-Spielfilme.',
      },
      {
        question: 'Wie kann man VOX online streamen?',
        answer: 'Über das Portal RTL+ steht der VOX-Livestream zur Verfügung; verpasste Folgen sind dort auf Abruf hinterlegt.',
      },
    ],
  },

  'kabel-eins': {
    summary: 'Kabel Eins bietet ein abwechslungsreiches Programm aus echten TV-Klassikern, beliebten Restaurant- und Auswanderer-Dokus sowie fundierten Infotainment-Magazinen. Hier finden Zuschauer Spielfilm-Highlights der Filmgeschichte und authentische Reportagen.',
    focus: 'Kult-Spielfilme, Gastronomie-Dokus, Auto- & Abenteuermagazine.',
    signatureShows: ['Mein Lokal, Dein Lokal', 'Rosins Restaurants', 'Abenteuer Leben', 'Trucker Babes'],
    broadcaster: 'ProSiebenSat.1 TV Deutschland GmbH',
    headquarters: 'Unterföhring bei München',
    streamInfo: 'Kostenlos über Joyn im Web und per App live empfangbar.',
    faqs: [
      {
        question: 'Wann läuft Mein Lokal, Dein Lokal auf Kabel Eins?',
        answer: 'Das Gastronomie-Duell mit Mike Süsser läuft montags bis freitags ab 17:55 Uhr.',
      },
      {
        question: 'Welche Filme zeigt Kabel Eins um 20:15 Uhr?',
        answer: 'Kabel Eins ist berühmt für die "Besten Filme aller Zeiten": Action-Klassiker, Western, Thriller und Sci-Fi-Meilensteine zur Prime Time.',
      },
      {
        question: 'Wo kann man Kabel Eins online schauen?',
        answer: 'Kabel Eins lässt sich kostenfrei im Live-Stream auf joyn.de streamen.',
      },
    ],
  },

  'rtl2': {
    summary: 'RTLZWEI steht für junges Reality-Fernsehen, packende Sozialdokumentationen, Daily Soaps aus deutschen Metropolen und spektakuläre Auto-Magazine. Der Sender richtet sich an ein trendbewusstes Publikum mit authentischen Geschichten.',
    focus: 'Daily Soaps, Sozialreportagen, Reality-Formate, Doku-Dramen und Spielfilme.',
    signatureShows: ['Berlin – Tag & Nacht', 'Köln 50667', 'Die Geissens', 'Hartz und herzlich', 'GRIP – Das Motormagazin'],
    broadcaster: 'RTL2 Fernsehen GmbH & Co. KG',
    headquarters: 'Grünwald bei München',
    streamInfo: 'Verfügbar über RTL+ sowie auf rtl2.de.',
    faqs: [
      {
        question: 'Wann laufen Berlin – Tag & Nacht und Köln 50667?',
        answer: 'Köln 50667 läuft montags bis freitags um 18:05 Uhr, direkt gefolgt von Berlin – Tag & Nacht um 19:05 Uhr.',
      },
      {
        question: 'Welche Reality-Dokus laufen zur Prime Time auf RTLZWEI?',
        answer: 'Um 20:15 Uhr zeigt RTLZWEI Formate wie Die Geissens, Hartz und herzlich, Armes Deutschland oder packende Spielfilme.',
      },
      {
        question: 'Wo kann man verpasste RTLZWEI-Folgen nachholen?',
        answer: 'Alle Episoden stehen nach TV-Ausstrahlung auf RTL+ zum kostenlosen Abruf bereit.',
      },
    ],
  },

  'arte': {
    summary: 'ARTE ist der europäische Kulturkanal, getragen von Deutschland und Frankreich. Mit anspruchsvollem Autorenkino, investigativen Dokumentationen, Konzerten und internationalen Koproduktionen steht ARTE für höchsten Fernsehanspruch und interkulturellen Austausch.',
    focus: 'Kultur, Autorenfilme, Dokumentationen, Konzerte, Theater und europäische Politik.',
    signatureShows: ['ARTE Journal', 'Tracks', 'ARTE Concert', 'Zu Tisch ...', 'Themenabende'],
    broadcaster: 'ARTE GEIE (Strasbourg)',
    headquarters: 'Straßburg / Baden-Baden',
    streamInfo: 'Kostenlos, ohne Registrierung und werbefrei auf arte.tv und in der ARTE App verfügbar.',
    faqs: [
      {
        question: 'Was unterscheidet das Programm von ARTE von anderen Sendern?',
        answer: 'ARTE verzichtet auf kommerzielle Werbeunterbrechungen und setzt auf exklusive europäische Spielfilme, preisgekrönte Dokumentarfilme und Konzerte aus allen Musikgenres.',
      },
      {
        question: 'Wann beginnt das Hauptabendprogramm auf ARTE?',
        answer: 'Die ARTE-Primetime startet täglich um 20:15 Uhr mit Dokumentationen, Filmklassikern oder internationalen Serienproduktionen.',
      },
      {
        question: 'Kann man ARTE-Sendungen in der Mediathek nachschauen?',
        answer: 'Ja, auf arte.tv stehen Dokumentationen und Filme oft schon vor der linearen Ausstrahlung und viele Wochen danach kostenfrei zur Verfügung.',
      },
    ],
  },

  '3sat': {
    summary: '3sat ist das gemeinsame werbefreie Kultur- und Wissenschaftsprogramm der vier öffentlich-rechtlichen Sender ZDF, ORF, SRG SSR und ARD. Der Sender beleuchtet gesellschaftliche Debatten, wissenschaftliche Durchbrüche, Literatur und Bühnenkunst im deutschsprachigen Raum.',
    focus: 'Wissenschaft, Kultur, Theater, Dokumentarfilm, Literatur und Gesellschaft.',
    signatureShows: ['Kulturzeit', 'nano', 'scobel', 'makro', '3satFestival'],
    broadcaster: 'ZDF, ORF, SRG SSR, ARD',
    headquarters: 'Mainz (ZDF-Sendezentrum)',
    streamInfo: 'Werbefrei in der 3sat-Mediathek auf 3sat.de abrufbar.',
    faqs: [
      {
        question: 'Wann laufen nano und Kulturzeit auf 3sat?',
        answer: 'Das Wissenschaftsmagazin nano läuft montags bis freitags um 18:30 Uhr, gefolgt vom Kulturmagazin Kulturzeit um 19:20 Uhr.',
      },
      {
        question: 'Welche Highlights bietet 3sat um 20:15 Uhr?',
        answer: 'Um 20:15 Uhr zeigt 3sat anspruchsvolle Spielfilme aus DACH-Produktionen, Naturdokumentationen oder Kabarett- und Theateraufzeichnungen.',
      },
      {
        question: 'Wo kann man 3sat live streamen?',
        answer: '3sat kann kostenlos und live über 3sat.de, die 3sat-App sowie über die Mediatheken von ZDF, ARD und ORF geschaut werden.',
      },
    ],
  },

  'orf-1': {
    summary: 'ORF 1 ist das moderne Vollprogramm des Österreichischen Rundfunks mit Fokus auf internationale Serienhits, Hollywood-Blockbuster, erstklassige Live-Sportübertragungen und aktuelle Comedy-Formate aus Österreich.',
    focus: 'Sportübertragungen (Ski Alpin, Formel 1, Fußball), Spielfilme, Serien und österreichische Satire.',
    signatureShows: ['ZIB Flash', 'Willkommen Österreich', 'Sport am Sonntag', 'Was gibt es Neues?'],
    broadcaster: 'Österreichischer Rundfunk (ORF)',
    headquarters: 'Wien (ORF-Zentrum Küniglberg)',
    streamInfo: 'In Österreich kostenfrei über ORF ON (on.orf.at) im Livestream abrufbar.',
    faqs: [
      {
        question: 'Welche Sport-Highlights überträgt ORF 1 live?',
        answer: 'ORF 1 ist die erste Adresse für Wintersport (alle Ski-Alpin-Weltcuprennen), die Formel 1 (im Wechsel mit ServusTV) sowie Fußball-Länderspiele der österreichischen Nationalmannschaft.',
      },
      {
        question: 'Was läuft heute um 20:15 Uhr auf ORF 1?',
        answer: 'Zur Prime Time um 20:15 Uhr zeigt ORF 1 Spielfilm-Highlights, beliebte Serien oder Live-Sportübertragungen.',
      },
      {
        question: 'Wie empfängt man ORF 1 in Deutschland oder der Schweiz?',
        answer: 'Über Satellit ist ORF 1 aus lizenzrechtlichen Gründen verschlüsselt (ORF Digital-Karte). Im grenznahen Raum in Bayern und Baden-Württemberg ist der Sender über Kabel und Antenne empfangbar.',
      },
    ],
  },

  'orf-2': {
    summary: 'ORF 2 ist das Informations- und Heimatprogramm des Österreichischen Rundfunks. Mit den täglichen Ausgaben der "Zeit im Bild", den neun regionalen Bundesland-Magazinen, Dokumentationen und Brauchtumssendungen ist ORF 2 der reichweitenstärkste TV-Sender Österreichs.',
    focus: 'Information, Politik, Regionalnachrichten aus den 9 Bundesländern, Kultur und Tradition.',
    signatureShows: ['Zeit im Bild (ZIB 1)', 'Bundesland heute', 'Universum', 'Report', 'Seitenblicke'],
    broadcaster: 'Österreichischer Rundfunk (ORF)',
    headquarters: 'Wien',
    streamInfo: 'In Österreich über ORF ON im Livestream verfügbar; ZIB-Nachrichten sind weltweit frei abrufbar.',
    faqs: [
      {
        question: 'Wann läuft die wichtigste Nachrichtensendung auf ORF 2?',
        answer: 'Die Hauptnachrichten "Zeit im Bild" (ZIB 1) beginnen täglich um 19:30 Uhr, gefolgt vom Kulturmagazin und den Bundesland-Sendungen um 19:00 Uhr.',
      },
      {
        question: 'Was läuft um 20:15 Uhr auf ORF 2?',
        answer: 'Um 20:15 Uhr zeigt ORF 2 preisgekrönte Dokumentationen der Reihe "Universum", Krimis, Heimatfilme oder politische Diskussionsrunden.',
      },
      {
        question: 'Kann man ORF 2 auch außerhalb Österreichs streamen?',
        answer: 'Eigene Nachrichtensendungen wie die ZIB und Dokumentationen können weltweit kostenfrei über ORF ON gestreamt werden.',
      },
    ],
  },

  'srf-1': {
    summary: 'SRF 1 ist das Flaggschiff von Schweizer Radio und Fernsehen (SRG SSR). Der Sender richtet sich an das Deutschschweizer Publikum mit fundierter Information, Dokumentationen über Land und Leute, Schweizer Spielfilmen und gesellschaftlich relevanten Magazinen.',
    focus: 'Nachrichten, Schweizer Dokumentarfilme, Konsumentenmagazine, Talkrunden und Unterhaltung.',
    signatureShows: ['Tagesschau', '10vor10', 'Kassensturz', 'Rundschau', 'SRF bi de Lüt'],
    broadcaster: 'Schweizer Radio und Fernsehen (SRF / SRG SSR)',
    headquarters: 'Zürich (Leutschenbach)',
    streamInfo: 'In der Schweiz kostenfrei über die Streaming-Plattform Play SRF (srf.ch/play) verfügbar.',
    faqs: [
      {
        question: 'Wann läuft die Tagesschau auf SRF 1?',
        answer: 'Die Hauptausgabe der Tagesschau beginnt täglich um 19:30 Uhr mit den wichtigsten Schweizer und internationalen Meldungen.',
      },
      {
        question: 'Was läuft zur Prime Time um 20:05 / 20:15 Uhr auf SRF 1?',
        answer: 'Auf SRF 1 starten die Abendprogramme meist um 20:05 Uhr mit Konsumentensendungen (Kassensturz), Diskussionsrunden (Club), Dokumentationen oder Schweizer Spielfilmen.',
      },
      {
        question: 'Wie kann man SRF 1 im Ausland sehen?',
        answer: 'Aus lizenzrechtlichen Gründen ist das volle Programm außerhalb der Schweiz geogeblockt. Nachrichtensendungen wie Tagesschau und 10vor10 sind weltweit auf srf.ch frei abrufbar.',
      },
    ],
  },

  'srf-zwei': {
    summary: 'SRF zwei ist das dynamische Unterhaltungs- und Sportprogramm der Deutschschweiz. Hier erleben Zuschauer alle großen Sportereignisse wie die Ski-Alpin-Rennen der Schweizer Weltcup-Stars, Fußball-Champions-League, Tennis und internationale Serienhits.',
    focus: 'Live-Sport (Ski Alpin, Fußball, Eishockey, Tennis), Spielfilme und internationale Serien.',
    signatureShows: ['sportaktuell', 'sportlive', 'Super10Kampf'],
    broadcaster: 'Schweizer Radio und Fernsehen (SRF / SRG SSR)',
    headquarters: 'Zürich',
    streamInfo: 'Live in der Schweiz über Play SRF abrufbar.',
    faqs: [
      {
        question: 'Welche Sportarten überträgt SRF zwei live?',
        answer: 'SRF zwei überträgt umfassend Ski Alpin, Schweizer Super League, Champions League, Eishockey-WM und Tennis Grand Slams.',
      },
      {
        question: 'Was läuft heute Abend auf SRF zwei?',
        answer: 'Neben Live-Sport zeigt SRF zwei am Abend packende Spielfilme, packende Thriller und internationale TV-Serien in HD.',
      },
      {
        question: 'Wo kann man SRF zwei streamen?',
        answer: 'Über die Play SRF App und auf srf.ch/sport steht der Livestream für Nutzer in der Schweiz zur Verfügung.',
      },
    ],
  },

  'hse24': {
    summary: 'HSE (früher HSE24) ist Deutschlands führendes Teleshopping-Netzwerk und sendet 24 Stunden täglich Live-Shopping-Sendungen für Mode, Beauty, Schmuck und Wohnaccessoires. Als Pionier des deutschen Teleshopping seit 1995 verbindet HSE inspirierende Produktpräsentationen mit direkter Kaufmöglichkeit per Telefon, App oder Website.',
    focus: 'Live-Teleshopping, Mode, Beauty & Kosmetik, Schmuck, Wohnen & Lifestyle.',
    signatureShows: ['Beauty Night', 'Fashion Week auf HSE', 'HSE Gold-Edition', 'Küche & Genuss'],
    broadcaster: 'HSE GmbH (Home Shopping Europe)',
    headquarters: 'Ismaning bei München',
    streamInfo: 'HSE sendet 24/7 als kostenloser Livestream auf hse.de und in der HSE-App für iOS und Android. Produkte können live per Telefon, App oder Website bestellt werden.',
    faqs: [
      {
        question: 'Was zeigt HSE24 (HSE) heute im Programm?',
        answer: 'HSE sendet rund um die Uhr Live-Shopping-Sendungen mit Mode, Beauty, Kosmetik, Schmuck, Wohnaccessoires und Lifestyle-Produkten. Den genauen Sendeplan mit Uhrzeiten und Themen findest du hier im Überblick.',
      },
      {
        question: 'Wie kann man bei HSE24 live Produkte bestellen?',
        answer: 'Während der Live-Sendungen können Produkte direkt über die HSE-Website (hse.de), die HSE-App oder telefonisch unter der jeweiligen Service-Nummer bestellt werden. Viele Artikel sind exklusiv nur während der Sendung erhältlich.',
      },
      {
        question: 'Wo kann man HSE24 (HSE) live im Stream sehen?',
        answer: 'HSE sendet rund um die Uhr als kostenloser Livestream auf hse.de und in der offiziellen HSE-App. Zusätzlich ist der Sender über alle gängigen TV-Kabelnetze, Satellit (ASTRA) und Internet-TV-Dienste empfangbar.',
      },
    ],
  },

  'crimeplusinvestigation': {
    summary: 'Crime+Investigation ist der führende True-Crime-Sender im deutschsprachigen Raum. Der Spartensender bietet fesselnde Dokumentationen über reale Kriminalfälle, Gerichtsverhandlungen, Cold Cases und forensische Ermittlungen rund um den Globus.',
    focus: 'Echte Kriminalfälle, True Crime Dokumentationen, Forensik und investigative Reportagen.',
    signatureShows: ['The First 48', 'Cold Case Files', 'Homicide Hunter', 'Killer Couples'],
    broadcaster: 'Hearst Networks EMEA / A+E Networks Germany',
    headquarters: 'München',
    streamInfo: 'Empfangbar über Pay-TV-Pakete von Sky, Vodafone, MagentaTV und als Channel auf Prime Video und Apple TV.',
    faqs: [
      {
        question: 'Was unterscheidet Crime+Investigation von herkömmlichen Krimisendern?',
        answer: 'Crime+Investigation zeigt ausschließlich echte Kriminalfälle (True Crime) mit Original-Ermittlern, Zeugenaussagen und forensischen Analysen statt fiktionaler Spielfilme.',
      },
      {
        question: 'Wann laufen die spannendsten True-Crime-Dokus auf Crime+Investigation?',
        answer: 'Das Hauptabendprogramm ab 20:15 Uhr widmet sich täglich mehrteiligen Dokumentationsreihen über ungelöste Mordfälle und historische Kriminalfälle.',
      },
      {
        question: 'Wie kann man Crime+Investigation in Deutschland, Österreich und der Schweiz empfangen?',
        answer: 'Der Sender wird über die gängigen Pay-TV-Plattformen von Sky Deutschland, Telekom MagentaTV, Vodafone GigaTV sowie über Kabelnetzbetreiber in AT und CH ausgestrahlt.',
      },
    ],
  },
};

/**
 * Returns tailored editorial profile and FAQs for any given channel slug.
 * If not in TOP_EDITORIAL, dynamically synthesizes a rich, unique profile.
 */
export function getChannelEditorial(slug: string, rawName: string): ChannelEditorial {
  const cleanName = rawName.replace(/^DE\s*-\s*/i, '').replace(/^AT\s*-\s*/i, '').replace(/^CH\s*-\s*/i, '').trim();

  if (TOP_EDITORIAL[slug]) {
    return TOP_EDITORIAL[slug];
  }

  // Check category & type dynamically
  const isRegional = slug.includes('bayern') || slug.includes('wdr') || slug.includes('ndr') || slug.includes('mdr') || slug.includes('swr') || slug.includes('rbb') || slug.includes('hr') || slug.includes('tv-');
  const isSport = slug.includes('sport') || slug.includes('dazn') || slug.includes('euro');
  const isMovie = slug.includes('kino') || slug.includes('cinema') || slug.includes('film');
  const isDocu = slug.includes('doku') || slug.includes('planet') || slug.includes('geo') || slug.includes('discovery') || slug.includes('history');
  const isMusic = slug.includes('music') || slug.includes('deluxe') || slug.includes('radio') || slug.includes('klassik');
  const isKids = slug.includes('kika') || slug.includes('disney') || slug.includes('nick') || slug.includes('junior');

  let typeLabel = 'Spezialsender';
  let focus = `Aktuelles Fernsehprogramm, Unterhaltungssendungen und ausgewählte Themenformate für ${cleanName}.`;

  if (isRegional) {
    typeLabel = 'Regionalsender';
    focus = `Regionalnachrichten, Heimatberichte, Lokalsport und Magazinsendungen aus der Region für ${cleanName}.`;
  } else if (isSport) {
    typeLabel = 'Sportsender';
    focus = `Live-Sportberichterstattung, Zusammenfassungen, Analysen und Sportmagazine auf ${cleanName}.`;
  } else if (isMovie) {
    typeLabel = 'Spielfilmsender';
    focus = `Nationale und internationale Spielfilme, Blockbuster, Klassiker und Genrefilme rund um die Uhr.`;
  } else if (isDocu) {
    typeLabel = 'Dokumentationssender';
    focus = `Faszinierende Dokumentarfilme, Reportagen über Geschichte, Natur, Wissenschaft und Technik.`;
  } else if (isMusic) {
    typeLabel = 'Musik- und Kultursender';
    focus = `Musikclips, Konzertübertragungen, Spezialshows und musikalische Unterhaltung.`;
  } else if (isKids) {
    typeLabel = 'Familien- und Kindersender';
    focus = `Altersgerechte Serien, Animationsfilme und unterhaltsame Wissensformate für Kinder und Familien.`;
  }

  return {
    summary: `${cleanName} ist ein beliebter ${typeLabel} im deutschsprachigen Fernsehen. Das Programm bietet den Zuschauern eine abwechslungsreiche Zusammenstellung aus tagesaktuellen Formaten, beliebten Serien, Magazinen und gezielten Themenschwerpunkten im Tages- und Abendverlauf.`,
    focus,
    broadcaster: cleanName,
    streamInfo: `Sendungen und Livestreams von ${cleanName} sind über die jeweiligen offiziellen Verbreitungswege, TV-Kabelnetze, Satellit oder Web-Angebote verfügbar.`,
    faqs: [
      {
        question: `Was läuft heute im Fernsehprogramm von ${cleanName}?`,
        answer: `Auf dieser Seite findest du den vollständigen Sendeplan von ${cleanName} für heute mit allen Beginnzeiten, Titeln, Beschreibungen und Genre-Kategorien im Tages- und Abendverlauf.`,
      },
      {
        question: `Wann beginnt das Abendprogramm um 20:15 Uhr auf ${cleanName}?`,
        answer: `Die Hauptsendezeit (Prime Time) auf ${cleanName} startet um 20:15 Uhr. In der Programmübersicht oben siehst du auf einen Blick, welche Filme, Serien oder Shows heute Abend zur besten Sendezeit laufen.`,
      },
      {
        question: `Wo und wie kann man ${cleanName} empfangen?`,
        answer: `${cleanName} kann über die gängigen TV-Verbreitungswege (digitales Kabel, Satellit oder Internet-TV-Anbieter wie Zattoo und waipu.tv) sowie teils über offizielle Mediatheken empfangen werden.`,
      },
    ],
  };
}
