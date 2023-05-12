const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
let db = null;
const dbPath = path.join(__dirname, "covid19India.db");
const initDBAndServer = async () => {
  // database initialization
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
  // server initialization
  app.listen(3000, () => {
    console.log("Server Started Successfully");
  });
};
initDBAndServer();

//API 1 - Returns a list of all states in the state table

app.get("/states/", async (request, response) => {
  const statesQuery = `
    SELECT * FROM state;`;
  const states = await db.all(statesQuery);
  const statesDetails = states.map((eachState) => ({
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  }));
  response.send(statesDetails);
});

//API 2 - Returns a state based on the state ID

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT * FROM state WHERE state_id = ${stateId};`;
  const singleState = await db.get(stateQuery);
  response.send({
    stateId: singleState.state_id,
    stateName: singleState.state_name,
    population: singleState.population,
  });
});

// API 3 - Create a district in the district table

app.post("/districts/", async (request, response) => {
  const bodyContent = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = bodyContent;
  const postQuery = `
    INSERT INTO district(district_name,state_id, cases, cured, active, deaths) 
    VALUES(
        '${districtName}', 
        ${stateId}, 
        ${cases}, 
        ${cured}, 
        ${active}, 
        ${deaths}
    ) ;`;
  await db.run(postQuery);
  response.send("District Successfully Added");
});

// API 4 - Returns a district based on the district ID

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
    SELECT * FROM district WHERE district_id = ${districtId};`;
  const theDistrict = await db.get(districtQuery);
  response.send({
    districtId: theDistrict.district_id,
    districtName: theDistrict.district_name,
    stateId: theDistrict.state_id,
    cases: theDistrict.cases,
    cured: theDistrict.cured,
    active: theDistrict.active,
    deaths: theDistrict.deaths,
  });
});

//API 5 - Deletes a district from the district table based on the district ID

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

// API 6 - Updates the details of a specific district based on the district ID

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const putBodyContent = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = putBodyContent;
  const updateQuery = `
    UPDATE district
    SET 
    district_name = '${districtName}', 
    state_id = ${stateId}, 
    cases = ${cases},
    cured = ${cured},
    active = ${active}, 
    deaths = ${deaths}
    WHERE district_id = ${districtId};`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

//API 7 - Returns the statistics of total cases, cured, deaths of a specific state

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `
    SELECT SUM(cases) as totalCases,
    SUM(cured) as totalCured,
    SUM(active) as totalActive,
    SUM(deaths) as totalDeaths
    FROM district
    WHERE state_id = ${stateId};
    `;
  const stat = await db.get(getQuery);
  response.send(stat);
});

// API 8 - Returns an object containing the state name of a district

app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const gettingStateViaDistrictQuery = `
    SELECT state_name FROM state INNER JOIN district 
    ON state.state_id = district.state_id
    WHERE district_id = ${districtId};
    `;
  const name = await db.get(gettingStateViaDistrictQuery);
  response.send({
    stateName: name.state_name,
  });
});

module.exports = app;
