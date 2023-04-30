import { createWorker } from 'tesseract.js';
import "@logseq/libs"


async function pocr(worker) {
    try {
        // necessary to have the window focused in order to access the clipboard
        window.focus();

        const clipboardItem = await navigator.clipboard.read()
        if (!clipboardItem) {
            console.error('No clipboard item found')
            return
        }
        console.log('Clipboard item: ', clipboardItem)
        const data = await clipboardItem[0].getType('image/png').catch(err => {
            throw new Error('Clipboard item is not an image')
        })
        console.log('Clipboard data: ', data)

        const ocrResult = await worker.recognize(
            data,
            'eng',
        )
        console.log('OCR result: ', ocrResult)
        return ocrResult.data.text
    } catch (err) {
        logseq.UI.showMsg('Failed to read image from clipboard: ' + err, 'error')
    }
}

const SETTINGS_SCHEMA = [
    {
        key: 'lang',
        type: 'string',
        title: 'lang',
        default: 'eng',
        description: 'The language for OCR. e.g., `chi_sim+eng` means Simplified Chinese & English. Please check [HERE](https://tesseract-ocr.github.io/tessdoc/Data-Files#data-files-for-version-400-november-29-2016) for supported languages'
    }
]

async function main() {
    logseq.useSettingsSchema(SETTINGS_SCHEMA);
    const lang = logseq.settings.lang || 'eng'

    const worker = await createWorker();
    await worker.loadLanguage(lang);
    await worker.initialize(lang);
    await worker.setParameters({
        preserve_interword_spaces: "1",
    });

    logseq.Editor.registerSlashCommand(
        'OCR image from clipboard',
        async () => {
            const text = await pocr(worker)
            await logseq.Editor.insertAtEditingCursor(text)
        },
    )
}


// bootstrap
logseq.ready(main).catch(console.error)