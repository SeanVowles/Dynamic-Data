<?php

    header('Content-Type: application/json');

    class Controller {
        // establish a connection
        private $conn;

        public function __construct() {
            include_once 'connection.php';
            try {
                $this->conn = new PDO("mysql:host=$hostname;dbname=$database", $username, $password);
                $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            } catch (PDOException $e) {
                echo 'Error: '.$e->getMessage();
            }
        }

        public function getTables() {
            $stmt = $this->conn->prepare('SHOW TABLES');
            $stmt->execute();

            $result = $stmt->fetchAll(PDO::FETCH_COLUMN);

            if ($stmt->rowCount() > 0) {
                return array('numOfRows' => $stmt->rowCount(), 'data' => array('tables' => $result));
            } else {
                return array('status' => 'ERROR', 'message' => 'No tables found in selected database.');
            }
        }

        public function getColumnsInTable($table) {
            try {
            $stmt = "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '$table'";
            $stmt = $this->conn->prepare($stmt);
            $stmt->execute();

            $result = $stmt->fetchAll(PDO::FETCH_COLUMN);
            return array('table' => $table, 'row_count' => $stmt->rowCount(), 'data' => array('columns' => $result));
            } catch (PDOException $error) {
            return array('status' => 'ERROR', 'message' => $error->getMessage());
            }
        }

        public function getTableContents($table) {
            $tableList = $this->getTables();

            if(in_array($table, $tableList['data']['tables'])) {
                $stmt = "SELECT * FROM ".$table;
                $stmt = $this->conn->query($stmt);

                $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
                return array('table' => $table, 'numOfRows' => $stmt->rowCount(), 'data' => $result);
            } else {
                return array('status' => 'ERROR', 'message' => 'Table was not found in selected database.');
            }
        }

        public function searchTable($table, $column, $value){
            try {
                $stmt = "SELECT * FROM $table WHERE $column LIKE :value";
                $stmt = $this->conn->prepare($stmt);
                $value = "%$value%";
                $stmt->bindParam(':value', $value);
                $stmt->execute();

                $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
                return array('table' => $table, 'row_count' => $stmt->rowCount(), 'data' => $result);
            } catch (PDOException $e) {
                return array('status' => 'ERROR', 'message' => $e->getMessage());
            }
        }

        public function addRow($table, array $data) {
            try {
                $stmt = "INSERT INTO $table (";
                $columnAmount = 0;
                $values = "";
                foreach($data as $key => $value){
                    if($columnAmount > 0){
                      $stmt .= ",";
                      $values .= ",";
                    }
                    $stmt .= "$key";
                    $values .= ":$key";
                    $columnAmount++;
                }

                $stmt .= ") VALUES ($values)";

                $stmt = $this->conn->prepare($stmt);

                foreach($data as $key => &$value){
                    $stmt->bindParam(":$key", $value);
                }

                $stmt->execute();

                return array('table' => $table, 'message' => 'New record (id: ' . $this->conn->lastInsertId() . ') inserted into table: ' . $table );
                } catch (PDOException $error) {
                return array('status' => 'ERROR', 'message' => $error->getMessage());
            }
        }

    }

    class JSONSchema {
        public $status = "OK";
        public $message;
        public $table;
        public $numOfRows;
        public $columns;
        public $data;

        private function setResponse($data) {
            // reports information about class
            $reflection = new ReflectionClass(get_class($this));

            if(is_array($data)){
                foreach($data as $key => $value){
                    foreach($reflection->getProperties() as $property) {
                        if($property->name == $key){
                            $this->$key = $value;
                        }
                    }
                }
            }
        }

        public function getResponse($data) {
            $this->setResponse($data);
            $json = array();

            // reflection reports information about a class
            $reflection = new ReflectionClass(get_class($this));
            foreach($reflection->getProperties() as $property){
                $name = $property->name;
                if($this->$name != NULL || is_int($this->$name)) {
                    $json[$name] = $this->$name;
                }
            }
            return "\n" . json_encode($json,JSON_PRETTY_PRINT);
        }
    }

    //Main Program Body
    $controller = new Controller();
    $response = new JSONSchema();

    if(isset($_GET['action'])) {
        switch ($_GET['action']) {
            case "getTables":
                echo $response->getResponse($controller->getTables());
            break;
            case "getTableContents":
                if(isset($_GET['table'])) {
                    echo $response->getResponse($controller->getTableContents($_GET['table']));
                } else {
                    echo $response->getResponse(array('status' => 'ERROR', 'message' => 'Table not defined.'));
                }
            break;
            case "getColumnsInTable":
                echo $response->getResponse($controller->getColumnsInTable($_GET['table']));
            break;
            case "searchTable":
                echo $response->getResponse($controller->searchTable($_GET['table'],$_GET['column'],$_GET['value']));
            break;
            case "addRow":
                $table = $_GET['table'];
                unset($_GET['action']);
                unset($_GET['table']);
                echo $response->getResponse($controller->addRow($table, $_GET));
            break;

            default:
                echo $response->getResponse(array('status' => 'ERROR', 'message' => 'Action not found.'));
            break;
        }
    }
?>
