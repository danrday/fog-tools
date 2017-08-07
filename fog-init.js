/* jshint node: true, asi: true, laxcomma: true, esversion: 6 */

require('shelljs/global')
require('colors')

const info = require("./util.js").info
const warn = require("./util.js").warn
const lnfd = require("./util.js").lnfd

const path = require('path')
const download = require('download')
const inq = require('inquirer')
const ora = require('ora')

const templates = require('./templates.json')

const fog = require('commander')
fog.parse(process.argv)

let tmpDir = path.resolve('/tmp/.fog-cli-workspace')

let outputDir = fog.args[1]
let outputPath = path.resolve(outputDir || '.')

let outputPathContents = ls('-lA', outputPath)

lnfd()
info('hey hows it going')
lnfd()

if (outputPath === path.resolve(__dirname)) {
    info('using current working directory')

    if (outputPathContents.length > 0) {
        warn('current working directory not empty. blarg.')
        exit(1)
    }
} else {
    info(`attempting to output project into ${outputPath}`)

    if (outputPathContents.length > 0) {
        warn('output dir not empty. blarg.')
        exit(1)
    }
}

lnfd()
info('tmpDir:', tmpDir)
info('outputPath: ', outputPath)
info('options:', fog.opts())
lnfd()

// pick from list
let template = pick(fog.args[0])

let spin

spin = ora('fetching template')
spin.start()

fetch(template.repo)
    .then(() => {
        spin.stop()

        info('fetched down ' + `${fog.args[0]}`.blue)
        info(`moving files into ${outputPath}`)

        spin.text = 'zug zug'
        spin.start()

        mv(`${tmpDir}/*/*`, outputPath)

        spin.stop()
        lnfd()

        return true
    })

    .then(askAddons)
    .then(addons => {
        lnfd()
        info('selected these addons', addons)
        return
    })

    .then(() => {
        info('cleaning downloaded garbage')

        spin.text = 'zug zug'
        spin.start()

        clean(tmpDir)

        spin.stop()

        lnfd()
        info('now' + ` cd ${outputDir} && <npm|yarn> install`.green)

        if (template.instructions) instructions(template.instructions)

        lnfd()
        info('thanks enjoy your dev have a good day')
    })
    .catch(err => {
        if (spin !== undefined) spin.stop()

        warn('something has gone terribly wrong')
        console.error(err)
        warn('and so i die')

        exit(1)
    })

function pick (name) {
    let t = templates[name]
    if (!t) {
        info(`No template by that name: ${name}`)
        exit(1)
    } else
        return t
}

function fetch (repo) {
    let url = `${repo}/archive/master.zip`

    clean(tmpDir)
    mkdir('-p', tmpDir)

    return download(url, tmpDir, { extract: true })
}

function askAddons () {
    return inq.prompt([
        {
            type: 'checkbox',
            message: 'Select addons',
            name: 'addons',
            choices: [
                { name: 'normalize.css', value: 'normalize' },
                { name: 'bulma.css', value: 'bulma' },
                { name: 'vue', value: 'vue' },
                { name: 'jquery', value: 'jquery' },
                { name: 'leaflet', value: 'leaflet' },
                { name: 'skeleton', value: 'skeleton' },
                { name: 'react', value: 'react' }
            ]
        }
    ])
}

function instructions (steps) {
    steps.forEach(step => { info('  + ' + step.white) })
}

function clean (dir) {
    rm('-rf', dir)
}

//function renderTemplate () {

//}

//function outputTemplate () {

//}
