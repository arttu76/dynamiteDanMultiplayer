const puppeteer = require('puppeteer');

const numberOfConcurrentRobots = 5;

const changeDirection = (page) => {
    page.evaluate(() => {
        const left=Math.random()<0.5;
        document.querySelector('#touch' + (!left ? 'Left': 'Right')).dispatchEvent(new Event('touchend'));
        document.querySelector('#touch' + (left ? 'Left': 'Right')).dispatchEvent(new Event('touchstart'));
    });
};

const writeChat = (page, text) => {
    page.evaluate(txt => {
        const input = document.querySelector('#chat input[type=text]');

        input.value = txt;

        const event = new Event('keyup');
        event.key = 'Enter';
        input.dispatchEvent(event);
    }, text);
};

const wait = async milliseconds => new Promise(resolve => setTimeout(() => resolve(), milliseconds));

(async () => {
    const browser = await puppeteer.launch({ headless: false, args: ['--window-size=800,800'] });

    const pages = await Promise.all(Array(numberOfConcurrentRobots).fill(null).map(async (_, idx) => {

        const page = await browser.newPage();
        page.goto('http://localhost:55080/?room=4,5&xy=138,46&name=puppet' + idx);
        await page.waitForSelector('#chat');

        // close about page if required
        if (idx === 0) {
            const openPages = await browser.pages();
            if (openPages.length > 1) {
                openPages[0].close();
            }
        }

        return page;
    }));

    let continueTesting = true;
    do {
        await wait(100);
        const pageIndex = Math.round(Math.random() * 1000) % pages.length;
        const page = (await browser.pages())[pageIndex];

        if (Math.random() < 0.1) {
            changeDirection(page);
        }
        if (Math.random() < 0.2) writeChat(page, 'Hello, I am testing as robot' + pageIndex + '!');

        continueTesting = page.evaluate(() => document.querySelector('#chat').innerHTML.indexOf('QUIT') !== -1);
    } while (continueTesting);

    await browser.close();

})();
