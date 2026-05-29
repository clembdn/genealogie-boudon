$summary = Get-Content "data/extracted/_summary.json" -Raw | ConvertFrom-Json
$sheets = $summary.sheets

$personnesParFamille = @{}
$toutesPersonnes = @()
$unionsParFamille = @{}

# Charger toutes les personnes
foreach ($sheet in $sheets) {
    $filePath = "data/extracted/$($sheet.slug).json"
    if (Test-Path $filePath) {
        $data = Get-Content $filePath -Raw | ConvertFrom-Json
        $personnesParFamille[$sheet.slug] = $data.persons
        foreach ($p in $data.persons) {
            $p | Add-Member -MemberType NoteProperty -Name "famille" -Value $sheet.slug
            $toutesPersonnes += $p
        }
    }
}

Write-Host "Total personnes chargées: $($toutesPersonnes.Length)"
Write-Host "Liste des familles:"
foreach ($sheet in $sheets) {
    $count = 0
    if ($personnesParFamille.ContainsKey($sheet.slug)) {
        $count = $personnesParFamille[$sheet.slug].Length
    }
    Write-Host "- $($sheet.name) ($($sheet.slug)): $count personnes"
}

# Trouver les personnes qui apparaissent dans plusieurs familles (liaisons de personnes)
$personneParId = @{}
$doublons = @()
foreach ($p in $toutesPersonnes) {
    if ($personneParId.ContainsKey($p.id)) {
        $doublons += [PSCustomObject]@{
            id = $p.id
            nom = "$($p.prenoms) $($p.nom)"
            famille1 = $personneParId[$p.id].famille
            famille2 = $p.famille
        }
    } else {
        $personneParId[$p.id] = $p
    }
}

Write-Host "`nDoublons d'ID (personnes partagées): $($doublons.Length)"
foreach ($d in $doublons) {
    Write-Host "  - Personne $($d.nom) (ID: $($d.id)) partagée entre $($d.famille1) et $($d.famille2)"
}

# Regarder les relations parent-child
# Un enfant a une relation avec ses parents
# Regardons si des relations lient des personnes de familles différentes
Write-Host "`nAnalyse des relations parent-child inter-familles..."
$interFamRelations = 0
foreach ($sheet in $sheets) {
    $filePath = "data/extracted/$($sheet.slug).json"
    if (Test-Path $filePath) {
        $data = Get-Content $filePath -Raw | ConvertFrom-Json
        foreach ($rel in $data.relations) {
            if ($rel.type -eq 'parent-child') {
                $fromP = $personneParId[$rel.fromId]
                $toP = $personneParId[$rel.toId]
                if ($fromP -and $toP -and ($fromP.famille -ne $toP.famille)) {
                    Write-Host "  - Relation parent-enfant: Parent $($fromP.prenoms) $($fromP.nom) ($($fromP.famille)) -> Enfant $($toP.prenoms) $($toP.nom) ($($toP.famille))"
                    $interFamRelations++
                }
            }
        }
    }
}
Write-Host "Total relations inter-familles: $interFamRelations"
