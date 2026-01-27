import { Partytown } from '@builder.io/partytown/react';
import Script from 'next/script';

export default function PartyTownScripts() {
    // const GA_MEASUREMENT_ID = 'GT-K8KF8BJN';
    const GA_MEASUREMENT_ID = 'G-4F0FTBLZ5K';

    return (
        <>
            <Partytown debug forward={['dataLayer.push']} />

            {/* Load gtag library */}
            <Script
                type="text/partytown"
                src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
                strategy="afterInteractive"
            />

            {/* Initialize Google Analytics */}
            <Script
                type="text/partytown"
                id="GA"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());
                      gtag('config', '${GA_MEASUREMENT_ID}');
                    `,
                }}
            />
        </>
    );
}