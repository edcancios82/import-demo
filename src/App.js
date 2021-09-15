import { useEffect, useState } from "react";
import {
  Navbar,
  Nav,
  Form,
  Button,
  Table,
  Container,
  Modal,
} from "react-bootstrap";
import "./App.css";
import * as XLSX from "xlsx";
import db from "./firebase";
import { saveAs } from "file-saver";

import ExcelJS from "exceljs/dist/es5/exceljs.browser.js";

function App() {
  const [users, setUsers] = useState([]);
  const [show, setShow] = useState(false);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleClose = () => {
    resetModal();
  };
  const handleShow = () => setShow(true);

  const processSheetData = (excelData) => {
    const wsname = excelData.SheetNames[0];
    const ws = excelData.Sheets[wsname];

    const dataParse = XLSX.utils.sheet_to_json(ws, { header: 1 });
    let csv = [];
    let headers = [];
    for (let i = 0; i < dataParse.length; i++) {
      if (dataParse[i] === "") continue;
      let fields = dataParse[i];
      if (i === 0) {
        headers = fields;
      } else {
        let csvRow = [];
        for (let field of fields) {
          if (!isNaN(field)) field = Number(field);
          csvRow.push(field);
        }
        csv.push(csvRow);
      }
    }
    setHeaders(headers);
    setRows(csv);
  };

  const handleFileUpload = (event) => {
    let file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const data = e.target.result;
      let readedData = XLSX.read(data, { type: "binary" });

      processSheetData(readedData);
    };
    reader.readAsBinaryString(file);
  };

  const resetModal = () => {
    setShow(false);
    setHeaders([]);
    setRows([]);
  };

  const handleSubmit = () => {
    let batch = db.batch();

    const formattedValues = rows.map((row) => {
      return {
        name: row[0],
        age: row[1],
      };
    });
    formattedValues.forEach((userRow) => {
      batch.set(db.collection("users").doc(), userRow);
    });
    batch.commit().then(function () {
      fetchUsers();
      resetModal();
    });
  };

  const fetchUsers = () => {
    db.collection("users")
      .get()
      .then((querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => doc.data());
        setUsers(data);
      });
  };

  async function readWriteToExcelfile(snapData) {
    // create a workbook variable
    var wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet();
    addRowsToExcelSheet(snapData, wb, ws);
  }

  async function addRowsToExcelSheet(snapData, workbook, worksheet) {
    // for loop to read each record from Products table
    snapData.forEach(function (data) {
      // get value for the record
      const val = data;
      // Add a row by sparse Array (assign to columns)
      var rowValues = [];
      rowValues[1] = val.name; // name
      rowValues[2] = val.age; // age
      // add row to worksheet
      worksheet.addRow(rowValues);
    });
    const buf = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buf]), "teste.xlsx");
  }

  const createFile = () => {
    readWriteToExcelfile(users);
  };

  return (
    <>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand href="#home">Importação de XLSX</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto"></Nav>
            <Button variant="outline-success" onClick={handleShow}>
              Importar
            </Button>
            <Button variant="outline-success" onClick={createFile}>
              Exportar
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container>
        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Selecionar arquivo</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {headers.length < 1 || rows.length < 1 ? (
              <Form.Group>
                <Form.File
                  id="file-upload"
                  onChange={(event) => handleFileUpload(event)}
                />
              </Form.Group>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>#</th>
                    {headers.map((item, index) => (
                      <th key={index}>{item}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length &&
                    rows.map((itemArray, itemIndex) => (
                      <tr key={itemIndex}>
                        <td>{itemIndex + 1}</td>
                        {itemArray.map((item, index) => (
                          <td key={index}>{item}</td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </Table>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSubmit}>
              Enviar
            </Button>
          </Modal.Footer>
        </Modal>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>Idade</th>
            </tr>
          </thead>
          <tbody>
            {users.length < 1 && (
              <tr>
                <td colSpan={3}>No users found.</td>
              </tr>
            )}
            {users &&
              users.map((user, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.age}</td>
                </tr>
              ))}
          </tbody>
        </Table>
      </Container>
    </>
  );
}

export default App;
