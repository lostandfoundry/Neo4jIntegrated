var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver').v1;

var app = express();

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
app.set('public', path.join(__dirname, 'public'))

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static(__dirname + '/public'));

var driver = neo4j.driver('bolt://hobby-nimcknmcieflgbkepkpnpidl.dbs.graphenedb.com:24787', neo4j.auth.basic('myapp', 'b.yntraNmvs9zf.OB5EVHINaBBWtc3M'))
var session = driver.session()

app.get("/", (req,res)=>{
    res.render("index.ejs");
})

app.get("/claim", (req, res) => {
    res.render("claim.ejs");
});

app.get('/populate', function (req, res) {
    session
        .run('START n=node(*) RETURN n')
        .then(function (result) {
            var peopleArr = []
            result.records.forEach(function (record) {
                peopleArr.push({
                    id: record._fields[0].identity.low,
                    title: record._fields[0].properties.name,
                    role: record._fields[0].properties.role,
                    org: record._fields[0].properties.organization,
                })
            })

            res.render('populate.ejs', {
                people: peopleArr
            })
        })
        .catch(function (err) {
            console.log(err)
        })
})

app.get('/search', function (req, res) {
    session
        .run("START n=node(*) RETURN n")
        .then(function (result) {
            var peopleArr = []
            result.records.forEach(function (record) {
                peopleArr.push({
                    id: record._fields[0].identity.low,
                    title: record._fields[0].properties.name,
                    safe: record._fields[0].properties.safe
                })
            })

            res.render('search.ejs', {
                people: peopleArr
            })
        })
        .catch(function (err) {
            console.log(err)
        })
})

app.post('/search',function(req,res){
    var name = req.body.name;
    var role = req.body.role;
    var org = req.body.org;

    session
        .run("MATCH (n {name:{nameParam}, role:{roleParam},organization:{orgParam}}) RETURN n",{nameParam:name,roleParam:role,orgParam:org})
        .then(function (result) {
            var peopleArr = []
            result.records.forEach(function (record) {
                peopleArr.push({
                    id: record._fields[0].identity.low,
                    title: record._fields[0].properties.name,
                    safe: record._fields[0].properties.safe
                })
            })

            res.render('search.ejs', {
                people: peopleArr
            })
        })
        .catch(function(err){
            console.log(err)
        })
})

app.post('/claim/person/person', function (req, res) {
    var name = req.body.name;
    var geo = req.body.geo;
    var condition = req.body.condition;
    var custommsg = req.body.custommsg;

    session
        .run("MATCH (n { name: {nameParam} }) SET n.safe = true", { nameParam: name })
        .then(function (result) {
            console.log(result)
            res.redirect('/claim#about')
            session.close()
        })
        .catch(function (err) {
            console.log(err)
        })
})
app.post('/person/add', function (req, res) {
    var name1 = req.body.name;
    var rol1 = req.body.role
    var org1 = req.body.org;
    var type1 = req.body.type;

    if (type1 === "person") {
        session
            .run("CREATE(n:person {name:{nameParam},role:{rolParam},organization:{orgParam}, safe:true}) RETURN n", { rolParam: rol1, nameParam: name1, orgParam: org1 })
            .then(function (result) {
                res.redirect('/')
                session.close()
            })
            .catch(function (err) {
                res.redirect('/')
                console.log(err)
            })
    }
    else if (type1 === "pet") {
        session
            .run("CREATE(n:pet {name:{nameParam},role:{rolParam},organization:{orgParam}, safe:true}) RETURN n", { rolParam: rol1, nameParam: name1, orgParam: org1 })
            .then(function (result) {
                res.redirect('/')
                session.close()
            })
            .catch(function (err) {
                console.log(err)
            })
    }
    else {
        session
            .run("CREATE(n:other {name:{nameParam},role:{rolParam},organization:{orgParam},safe:true}) RETURN n", { rolParam: rol1, nameParam: name1, orgParam: org1 })
            .then(function (result) {
                res.redirect('/')
                session.close()
            })
            .catch(function (err) {
                console.log(err)
            })
        res.redirect('/')
    }
})


app.post('/person/del', function (req, res) {
    var name1 = req.body.name1;
    var name2 = req.body.name2;
    session
        .run("MATCH (n { name: {nameParam1} })-[r]->(k {name: {nameParam2}}) DELETE r", { nameParam1: name1, nameParam2: name2 })
        .then(function (result) {
            res.redirect('/')
            session.close()
        })
        .catch(function (err) {
            console.log(err)
        })
    res.redirect('/')
})


app.post('/person/link', function (req, res) {
    var name1 = req.body.name1;
    var connect = req.body.connect;
    var name2 = req.body.name2;

    if (connect === "friend")
        session
            .run("MATCH (a:person),(b:person) WHERE a.name = {name1Param} AND b.name = {name2Param} CREATE (a)-[r:friend]->(b)", { name1Param: name1, name2Param: name2 })
            .then(function (result) {
                res.redirect('/')
                session.close()
            })
            .catch(function (err) {
                console.log(err)
            })
    else if (connect === "relative")
        session
            .run("MATCH (a:person),(b:person) WHERE a.name = {name1Param} AND b.name = {name2Param} CREATE (a)-[r:relative]->(b)", { name1Param: name1, name2Param: name2 })
            .then(function (result) {
                res.redirect('/')
                session.close()
            })
            .catch(function (err) {
                console.log(err)
            })
    else if (connect === "neighbour")
        session
            .run("MATCH (a:person),(b:person) WHERE a.name = {name1Param} AND b.name = {name2Param} CREATE (a)-[r:neighbour]->(b)", { name1Param: name1, name2Param: name2 })
            .then(function (result) {
                res.redirect('/')
                session.close()
            })
            .catch(function (err) {
                console.log(err)
            })
    else if (connect === "colleague")
        session
            .run("MATCH (a:person),(b:person) WHERE a.name = {name1Param} AND b.name = {name2Param} CREATE (a)-[r:colleague]->(b)", { name1Param: name1, name2Param: name2 })
            .then(function (result) {
                res.redirect('/')
                session.close()
            })
            .catch(function (err) {
                console.log(err)
            })
    else if (connect === "owner")
        session
            .run("MATCH (a:person),(b:pet) WHERE a.name = {name1Param} AND b.name = {name2Param} CREATE (a)-[r:owner]->(b)", { name1Param: name1, name2Param: name2 })
            .then(function (result) {
                res.redirect('/')
                session.close()
            })
            .catch(function (err) {
                console.log(err)
            })
    else
        session
            .run("MATCH (a:person),(b:person) WHERE a.name = {name1Param} AND b.name = {name2Param} CREATE (a)-[r:other]->(b)", { name1Param: name1, name2Param: name2 })
            .then(function (result) {
                res.redirect('/')
                session.close()
            })
            .catch(function (err) {
                console.log(err)
            })
    res.redirect('/')
})

app.listen(3000)
console.log('Server started on port 3000')

module.exports = app
