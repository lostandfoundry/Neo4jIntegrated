var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1

var app = express();

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(path.join(__dirname, 'public')))

var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', 'ibmhack'))
var session = driver.session()

app.get('/', function (req, res) {
    session
        .run('START n=node(*) RETURN n')
        .then(function (result) {
            var peopleArr = []
            result.records.forEach(function (record) {
                peopleArr.push({
                    id: record._fields[0].identity.low,
                    title: record._fields[0].properties.name,
                    org: record._fields[0].properties.organization,
                })
            })

            session
                .run("MATCH (n { name: 'ram' }) DETACH DELETE n")//substitute for own query
                .then(function (result) {
                    console.log(result)
                })
                .catch(function (err) {
                    console.log(err)
                })

            res.render('index.ejs', {
                people: peopleArr
            })
        })
        .catch(function (err) {
            console.log(err)
        })
})

app.listen(3000)
console.log('Server started on port 3000')

module.exports = app
