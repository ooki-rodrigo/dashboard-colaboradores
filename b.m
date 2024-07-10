let
    Personalizar1 = let
    ObterLogsPorUsuario = (idUsuario) => 
        let

        ObterLogPorPagina = (idUsuario, page) =>
        let

            urlBase = "https://online.universidadedafarmacia.com.br",
            headers = [#"Lw-Client"="63cfd92085cf5d2cb507c4b2", Authorization="Bearer TdVcqjGv9NsyHuBNty6rIvzqXRbs113Qqu9fg4kO"],


            response = try Json.Document(Web.Contents(urlBase, [RelativePath = "/admin/api/v2/event-logs?user_id=" & idUsuario, Headers=headers, Query = [page = Text.From(page)]])) otherwise null,
            data = if response <> null then response[data] else null,
        
        in
            data,


             // Get the total number of pages for progress data
        totalPages = try Json.Document(Web.Contents(urlBase, [RelativePath = "/admin/api/v2/event-logs?user_id=" & idUsuario, Headers = headers]))[meta][totalPages] otherwise 1,

        // Fetch progress data for all pages
        allLogPages = try List.Generate(
            () => 1, // Initial value
            each _ <= totalPages, // Condition to continue
            each _ + 1, // Increment
            each ObterLogPorPagina(idUsuario, _) // Generate the progress data for each page
        ) otherwise null,

        // Combine the progress data from all pages
        combinedLogs = try Table.Combine(allLogPages) otherwise null
    in
        combinedLogs,
 
    // Substitua SuaConsultaParaObterIDs pelo nome real da sua consulta
    SuaConsultaParaObterIDs = 
        let
            urlBase = "https://online.universidadedafarmacia.com.br",
            headers = [#"Lw-Client"="63cfd92085cf5d2cb507c4b2", #"Content-Type"="application/json", Authorization="Bearer BMZGrB46KCBaFLPko7gIjBbhXLoT3QQyKg4ybJb4"],
 
            // Função para fazer a chamada à API e retornar os resultados de uma página específica
            ObterUsuarios = (pagina) => Json.Document(Web.Contents(urlBase, [RelativePath = "/admin/api/v2/users?page=" & Text.From(pagina) & "&items_per_page=200", Headers=headers])),
 
            todasAsPaginas = List.Generate(
                () => 1, // valor inicial
                each _ <= (ObterUsuarios(_)[meta][totalPages]), // condição de continuação
                each _ + 1, // incremento
                each _
            ),
            tabelasPorPagina = List.Transform(todasAsPaginas, (pagina) => Table.FromRecords(ObterUsuarios(pagina)[data])),
 
            tabelaResultante = Table.Combine(tabelasPorPagina),
 
            // Filtrar os registros onde a coluna last_login não é nula
            tabelaFiltrada = Table.SelectRows(tabelaResultante, each [last_login] <> null),
 
            // Selecionar apenas a coluna 'id'
            tabelaFinal = Table.SelectColumns(tabelaFiltrada, {"id"}),
 
            // Chamar a função para importar todas as páginas
            tabelaUsuarios = tabelaFinal
        in
            tabelaUsuarios,
 
    // Obter a lista de IDs de usuários
    listaIDs = SuaConsultaParaObterIDs,
 
    // Obter os logs para cada ID de usuário
    logsPorUsuario = List.Transform(listaIDs[id], each ObterLogsPorUsuario(_)),
 
    // Combinar todas as tabelas resultantes em uma única tabela
    tabelaLogs = Table.FromList(logsPorUsuario, Splitter.SplitByNothing()),
    #"Column1 Expandido" = Table.ExpandListColumn(tabelaLogs, "Column1"),
    #"Column1 Expandido1" = Table.ExpandRecordColumn(#"Column1 Expandido", "Column1", {"user", "created", "activity", "description", "type", "additional_info"}, {"user", "created", "activity", "description", "type", "additional_info"}),
    #"user Expandido" = Table.ExpandRecordColumn(#"Column1 Expandido1", "user", {"id", "username"}, {"id", "username"}),
    #"Tipo Alterado" = Table.TransformColumnTypes(#"user Expandido",{{"id", type text}, {"username", type text}, {"created", type number}, {"activity", type text}, {"description", type text}, {"type", type text}}),
    // Converter as colunas "created" e "last_login" de Unix para data e hora
    #"Data de Criação Convertida" = Table.TransformColumns(#"Tipo Alterado", {
        {"created", each #datetime(1970, 1, 1, 0, 0, 0) + #duration(0, -3, 0, _), type datetime}
    })
in
    #"Data de Criação Convertida",
    #"Linhas Filtradas" = Table.SelectRows(Personalizar1, each ([activity] <> "failed_purchase" and [activity] <> "free_enrollment" and [activity] <> "logout" and [activity] <> "manual_enrollment" and [activity] <> "register")),
    #"additional_info Expandido" = Table.ExpandRecordColumn(#"Linhas Filtradas", "additional_info", {"course"}, {"course"})
in
    #"additional_info Expandido"