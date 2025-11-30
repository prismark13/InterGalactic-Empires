<#
.SYNOPSIS
INTERGALACTICA MISSION CONTROL // WINDOWS OPS
#>

function Show-Menu {
    Clear-Host
    Write-Host "=== INTERGALACTICA VERSION CONTROL (WINDOWS) ===" -ForegroundColor Cyan
    $current = git branch --show-current
    Write-Host "Current Branch: $current"
    Write-Host "--------------------------------------"
    Write-Host "1. Initialize New Repository (First Run)"
    Write-Host "2. Start Experiment (Create New Branch)"
    Write-Host "3. Save Progress (Commit & Push)"
    Write-Host "4. MERGE Experiment (Apply to Main)"
    Write-Host "5. ABORT Experiment (Rollback to Main)"
    Write-Host "6. Exit"
    Write-Host "--------------------------------------"
    
    $choice = Read-Host "Select Directive (1-6)"
    Run-Directive $choice
}

function Run-Directive($selection) {
    switch ($selection) {
        "1" {
            Write-Host "Initializing Prime Timeline..." -ForegroundColor Green
            git init
            git add .
            git commit -m "Initial Commit: Core Systems Online"
            git branch -M main
            Write-Host "Repository Active."
            Read-Host "Press Enter to continue..."
        }
        "2" {
            $name = Read-Host "Enter Experiment Name (e.g. new-ships)"
            git checkout -b "feature/$name"
            Write-Host "Timeline Diverged. You are now in 'feature/$name'." -ForegroundColor Green
            Read-Host "Press Enter to continue..."
        }
        "3" {
            git add .
            $msg = Read-Host "Enter Log Message"
            git commit -m "$msg"
            Write-Host "Progress Saved." -ForegroundColor Green
            Read-Host "Press Enter to continue..."
        }
        "4" {
            $current = git branch --show-current
            if ($current -eq "main") {
                Write-Host "ERROR: You are already on Main." -ForegroundColor Red
            } else {
                Write-Host "Merging $current into Main..." -ForegroundColor Cyan
                git checkout main
                git merge $current
                git branch -d $current
                Write-Host "Experiment Successful. Timeline Merged." -ForegroundColor Green
            }
            Read-Host "Press Enter to continue..."
        }
        "5" {
            Write-Host "WARNING: THIS WILL DELETE ALL EXPERIMENTAL DATA." -ForegroundColor Red
            $confirm = Read-Host "Are you sure? (y/n)"
            if ($confirm -eq "y") {
                $current = git branch --show-current
                git checkout main
                git branch -D $current
                Write-Host "Experiment Purged. Restored to Prime Timeline." -ForegroundColor Red
            }
            Read-Host "Press Enter to continue..."
        }
        "6" {
            exit
        }
        Default {
            Write-Host "Invalid Command."
            Read-Host "Press Enter to continue..."
        }
    }
    Show-Menu
}

# Execution Policy Check (Run this once if script fails)
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Show-Menu