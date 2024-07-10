let
    urlBase = "https://online.universidadedafarmacia.com.br",
    headers = [#"Lw-Client"="63cfd92085cf5d2cb507c4b2", #"Content-Type"="application/json", Authorization="Bearer 5b2fZpcER0VklCo8pHTLTwMcyUu51vyoefNkBemZ"],







    // PROGRESSO DE EMAILS
    GetProgress = (email as text) =>
    let


       
    FetchProgressPage = (email, page) =>
    let
        
      
    
        response = try Json.Document(Web.Contents(urlBase,
            [RelativePath = "/admin/api/v2/users/" & email & "/progress",
            Headers = headers,
            Query = [page = Text.From(page), items_per_page = "20"]
        ])) otherwise null,
     
        dataProgresso = if response <> null then response[data] else null,
     
   
        table = if dataProgresso <> null then Table.FromList(dataProgresso, Splitter.SplitByNothing(), null, null, ExtraValues.Error) else null,
 
        expanded = if table <> null then Table.ExpandRecordColumn(table, "Column1", {"course_id", "status", "progress_rate", "average_score_rate", "time_on_course", "total_units", "completed_units"}, {"course_id", "status", "progress_rate", "average_score_rate", "time_on_course", "total_units", "completed_units"}) else null
    in
        expanded,
        


        // Get the total number of pages for progress data
        totalPages = try Json.Document(Web.Contents(urlBase, [RelativePath = "/admin/api/v2/users/" & email & "/progress", Headers = headers]))[meta][totalPages] otherwise 1,

        // Fetch progress data for all pages
        allProgressPages = try List.Generate(
            () => 1, // Initial value
            each _ <= totalPages, // Condition to continue
            each _ + 1, // Increment
            each FetchProgressPage(email, _) // Generate the progress data for each page
        ) otherwise null,

        // Combine the progress data from all pages
        combinedProgress = try Table.Combine(allProgressPages) otherwise null
    in
        combinedProgress,








    // Importar tabela de usuários
    tabelaUsuarios = 
        let
            headers = [#"Lw-Client"="63cfd92085cf5d2cb507c4b2", #"Content-Type"="application/json", Authorization="Bearer 5b2fZpcER0VklCo8pHTLTwMcyUu51vyoefNkBemZ"],
            ObterUsuarios = (pagina) => Json.Document(Web.Contents(urlBase,[RelativePath = "/admin/api/v2/users?page=" & Text.From(pagina) & "&items_per_page=200", Headers=headers])),
            
            todasAsPaginas = List.Generate(
                () => 1, // valor inicial
                each _ <= (ObterUsuarios(_)[meta][totalPages]), // condição de continuação
                each _ + 1, // incremento
                each _
            ),
    
    tabelasPorPagina = List.Transform(todasAsPaginas, (pagina) => Table.FromRecords(ObterUsuarios(pagina)[data])),

    tabelaResultante = Table.Combine(tabelasPorPagina), // Corrigido o argumento desta linha

            #"Data de Criação Convertida" = Table.TransformColumns(tabelaResultante, {
                {"created", each try #datetime(1970, 1, 1, 0, 0, 0) + #duration(0, 0, 0, _) - #duration(0, 3, 0, 0) otherwise null, type nullable datetime},
                {"last_login", each try #datetime(1970, 1, 1, 0, 0, 0) + #duration(0, 0, 0, _) - #duration(0, 3, 0, 0) otherwise null, type nullable datetime}
            }),
            #"Colunas Removidas" = Table.RemoveColumns(#"Data de Criação Convertida",{"subscribed_for_marketing_emails", "eu_customer", "is_admin", "is_instructor", "is_suspended", "is_reporter", "role", "is_affiliate", "referrer_id", "created", "signup_approval_status", "email_verification_status", "fields", "tags", "utms", "billing_info", "nps_score", "nps_comment"}),
            #"Linhas Classificadas" = Table.Sort(#"Colunas Removidas",{{"last_login", Order.Descending}, {"email", Order.Ascending}}),
            #"Tipo Alterado" = Table.TransformColumnTypes(#"Linhas Classificadas",{{"email", type text}, {"id", type text}, {"username", type text}}),
            #"Linhas Filtradas" = Table.SelectRows(#"Tipo Alterado", each [last_login] <> null and [last_login] <> "")
        in
            #"Linhas Filtradas",

    // Adicionar coluna de progresso à tabela de usuários
    tabelaFinal = Table.AddColumn(tabelaUsuarios, "Progresso", each GetProgress([email])),
    #"Expandido Progresso" = Table.ExpandTableColumn(tabelaFinal, "Progresso", {"course_id", "status", "progress_rate", "average_score_rate", "time_on_course", "total_units", "completed_units"}, {"Progresso_course_id", "Progresso_status", "Progresso_progress_rate", "Progresso_average_score_rate", "Progresso_time_on_course", "Progresso_total_units", "Progresso_completed_units"}),
    #"Colunas Renomeadas" = Table.RenameColumns(#"Expandido Progresso",{{"last_login", "ultimo_login_usuario"}, {"Progresso_course_id", "id_curso"}, {"Progresso_status", "status_progresso"}}),
    #"Tipo Alterado" = Table.TransformColumnTypes(#"Colunas Renomeadas",{{"id_curso", type text}, {"status_progresso", type text}}),
    #"Colunas Renomeadas1" = Table.RenameColumns(#"Tipo Alterado",{{"Progresso_progress_rate", "percentual_progresso"}, {"Progresso_average_score_rate", "pontuacao_media"}}),
    #"Tipo Alterado1" = Table.TransformColumnTypes(#"Colunas Renomeadas1",{{"pontuacao_media", type number}, {"percentual_progresso", Percentage.Type}}),
    #"Personalização Adicionada" = Table.AddColumn(#"Tipo Alterado1", "Personalizar", each [percentual_progresso] / 100),
    #"Tipo Alterado2" = Table.TransformColumnTypes(#"Personalização Adicionada",{{"Personalizar", Percentage.Type}}),
    #"Colunas Removidas" = Table.RemoveColumns(#"Tipo Alterado2",{"percentual_progresso"}),
    #"Colunas Reordenadas" = Table.ReorderColumns(#"Colunas Removidas",{"id", "email", "username", "ultimo_login_usuario", "id_curso", "status_progresso", "Personalizar", "pontuacao_media", "Progresso_time_on_course", "Progresso_total_units", "Progresso_completed_units"}),
    #"Colunas Renomeadas2" = Table.RenameColumns(#"Colunas Reordenadas",{{"Personalizar", "percentual_progresso"}}),
    #"Tipo Alterado3" = Table.TransformColumnTypes(#"Colunas Renomeadas2",{{"Progresso_time_on_course", Int64.Type}}),
    #"Colunas Renomeadas3" = Table.RenameColumns(#"Tipo Alterado3",{{"Progresso_time_on_course", "tempo_gasto_curso_segundos"}, {"Progresso_total_units", "total_atividades_curso"}}),
    #"Tipo Alterado4" = Table.TransformColumnTypes(#"Colunas Renomeadas3",{{"total_atividades_curso", Int64.Type}}),
    #"Colunas Renomeadas4" = Table.RenameColumns(#"Tipo Alterado4",{{"Progresso_completed_units", "total_atividades_concluidas_curso"}}),
    #"Tipo Alterado5" = Table.TransformColumnTypes(#"Colunas Renomeadas4",{{"total_atividades_concluidas_curso", Int64.Type}})
in
    #"Tipo Alterado5"