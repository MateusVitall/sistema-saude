CREATE TABLE pacientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    data_nascimento DATE,
    cpf VARCHAR(14) UNIQUE,
    telefone VARCHAR(15)
);

CREATE TABLE prontuarios (
    id SERIAL PRIMARY KEY,
    paciente_id INT REFERENCES pacientes(id),
    data_atendimento DATE,
    descricao TEXT
);

CREATE OR REPLACE PROCEDURE inserir_paciente(
    p_nome VARCHAR,
    p_data_nascimento DATE,
    p_cpf VARCHAR,
    p_telefone VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO pacientes(nome, data_nascimento, cpf, telefone)
    VALUES (p_nome, p_data_nascimento, p_cpf, p_telefone);
END;
$$;

CREATE OR REPLACE FUNCTION quantidade_atendimentos_por_cpf(p_cpf VARCHAR)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    total INT;
BEGIN
    SELECT COUNT(pr.id) INTO total
        FROM prontuarios pr
        JOIN pacientes p ON pr.paciente_id = p.id
        WHERE p.cpf = p_cpf;
    RETURN total;
END;
$$;

CREATE OR REPLACE FUNCTION definir_data_atendimento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.data_atendimento IS NULL THEN
        NEW.data_atendimento := CURRENT_DATE;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_definir_data_atendimento
BEFORE INSERT ON prontuarios
FOR EACH ROW
EXECUTE FUNCTION definir_data_atendimento();

INSERT INTO pacientes (nome, data_nascimento, cpf, telefone) VALUES
('Ana Beatriz Lima', '1990-03-15', '123.456.789-01', '(11) 91234-5678'),
('Carlos Eduardo Souza', '1985-07-22', '234.567.890-12', '(21) 99876-5432'),
('Mariana Rocha', '1998-11-05', '345.678.901-23', '(31) 98877-6655'),
('João Pedro Martins', '2001-06-30', '456.789.012-34', '(41) 97766-5544'),
('Fernanda Alves', '1975-12-10', '567.890.123-45', '(51) 96655-4433');

-- Inserir prontuários (alguns com data, outros sem — para acionar a trigger)
INSERT INTO prontuarios (paciente_id, data_atendimento, descricao) VALUES
(1, '2025-07-30', 'Consulta de rotina, sem queixas.'),
(2, NULL, 'Paciente relatou dores de cabeça frequentes. Encaminhado para exame.'),
(3, '2025-07-28', 'Revisão pós-operatória, tudo dentro da normalidade.'),
(4, NULL, 'Consulta inicial, histórico médico registrado.'),
(5, '2025-07-15', 'Retorno após tratamento com antibióticos.');

SELECT * FROM pacientes;

SELECT * FROM prontuarios;

--Inserir novo prontuário sem data (para testar a trigger)
INSERT INTO prontuarios(paciente_id, descricao) VALUES
(2, 'Nova consulta sem data definida.'),
(3, 'Nova consulta sem data definida.');

SELECT * FROM prontuarios;

-- Tabela medicos
CREATE TABLE medicos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100),
    especialidade VARCHAR(100)
);

--Tabela consultas (ligando médicos e pacientes)
CREATE TABLE consultas (
    id SERIAL PRIMARY KEY,
    paciente_id INT REFERENCES pacientes(id),
    medico_id INT REFERENCES medicos(id),
    data_consulta DATE,
    valor NUMERIC(10,2)
);

INSERT INTO medicos (nome, especialidade) VALUES
('Dra. Laura Mendes', 'Clínico Geral'),
('Dr. Paulo Henrique', 'Cardiologista'),
('Dra. Renata Silva', 'Ginecologista');

INSERT INTO consultas (paciente_id, medico_id, data_consulta, valor) VALUES
(1, 1, '2025-07-25', 200.00),
(2, 2, '2025-07-26', 350.00),
(3, 1, '2025-07-27', 200.00),
(4, 3, '2025-07-28', 250.00),
(5, 2, '2025-07-29', 350.00),
(1, 2, '2025-07-30', 350.00);

select * from consultas;

--Procedure para inserir consulta
CREATE OR REPLACE PROCEDURE inserir_consulta(
    p_paciente_id INT,
    p_medico_id INT,
    p_data DATE,
    p_valor NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO consultas(paciente_id, medico_id, data_consulta, valor)
    VALUES (p_paciente_id, p_medico_id, p_data, p_valor);
END;
$$;

--Function de agregação: total gasto por paciente
CREATE OR REPLACE FUNCTION total_gasto_paciente(p_id INT)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
    total NUMERIC;
BEGIN
    SELECT SUM(valor) INTO total
    FROM consultas
    WHERE paciente_id = p_id;
    
    RETURN COALESCE(total, 0);
END;
$$;

--Consulta com JOIN + GROUP BY + função de agregação
-- Total gasto por cada paciente
SELECT p.nome, COUNT(c.id) AS qtd_consultas, SUM(c.valor) AS total_gasto
FROM pacientes p
JOIN consultas c ON p.id = c.paciente_id
GROUP BY p.nome;

--Update
UPDATE pacientes 
SET telefone = ‘(21) 95555-0000’ 
WHERE cpf = ‘234.567.890-12’;


--Delete
DELETE FROM consultas 
WHERE id = 3;
