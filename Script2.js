{
    "layout": {
        "def": [
            {
                "containerType": "DefaultForm",
                "index": "0"
            },
            {
                "containerType": "Columns",
                "index": "1",
                "fieldCollections": [
                    {
                        "name": "1",
                        "fields": [
                            {
                                "fieldInternalName": "Title"
                            },
                            {
                                "fieldInternalName": "FullName"
                            },
                            {
                                "fieldInternalName": "ContentType"
                            }
                        ]
                    },
                    {
                        "name": "2",
                        "fields": [
                            {
                                "fieldInternalName": "FirstName"
                            },
                            {
                                "fieldInternalName": "Company"
                            },
                            {
                                "fieldInternalName": "JobTitle"
                            }
                        ]
                    }
                ]
            },
            {
                "containerType": "Columns",
                "index": "2",
                "fieldCollections": [
                    {
                        "name": "1",
                        "fields": [
                            {
                                "fieldInternalName": "Code"
                            }
                        ]
                    },
                    {
                        "name": "2",
                        "fields": [
                            {
                                "fieldInternalName": "Region"
                            },
                            {
                                "fieldInternalName": "SalesRegion"
                            }
                        ]
                    },
                    {
                        "name": "3",
                        "fields": [
                            {
                                "fieldInternalName": "State"
                            },
                            {
                                "fieldInternalName": "SalesDivision"
                            }
                        ]
                    },
                    {
                        "name": "4",
                        "fields": [
                            {
                                "fieldInternalName": "SalesState"
                            }
                        ]
                    }
                ]
            },
            {
                "containerType": "Tabs",
                "index": "3",
                "fieldCollections": [
                    {
                        "name": "Address",
                        "fields": [
                            {
                                "fieldInternalName": "WorkAddress"
                            },
                            {
                                "fieldInternalName": "WorkCity"
                            },
                            {
                                "fieldInternalName": "WorkState"
                            },
                            {
                                "fieldInternalName": "WorkZip"
                            },
                            {
                                "fieldInternalName": "WorkCountry"
                            }
                        ]
                    },
                    {
                        "name": "Phone",
                        "fields": [
                            {
                                "fieldInternalName": "WorkPhone"
                            },
                            {
                                "fieldInternalName": "CellPhone"
                            },
                            {
                                "fieldInternalName": "WorkFax"
                            },
                            {
                                "fieldInternalName": "HomePhone"
                            }
                        ]
                    },
                    {
                        "name": "HR",
                        "fields": [
                            {
                                "fieldInternalName": "EmployeeId"
                            },
                            {
                                "fieldInternalName": "HireDate"
                            }
                        ]
                    }
                ]
            },
            {
                "containerType": "Accordion",
                "index": "4",
                "fieldCollections": [
                    {
                        "name": "E-Address",
                        "fields": [
                            {
                                "fieldInternalName": "Email"
                            },
                            {
                                "fieldInternalName": "WebPage"
                            }
                        ]
                    },
                    {
                        "name": "Notes & Attachments",
                        "fields": [
                            {
                                "fieldInternalName": "Comments"
                            },
                            {
                                "fieldInternalName": "Attachments"
                            }
                        ]
                    },
                    {
                        "name": "HR",
                        "fields": [
                            {
                                "fieldInternalName": "EmergencyContact"
                            },
                            {
                                "fieldInternalName": "HomeAddress"
                            }
                        ]
                    }
                ]
            }
        ]
    },
    "visibility": {
        "def": {
            "FullName": [
                {
                    "state": "Editable",
                    "appliesTo": "Managers",
                    "forms": "New;Edit;Display",
                    "conditions": []
                },
                {
                    "state": "Editable",
                    "appliesTo": "",
                    "forms": "New;Edit;Display",
                    "conditions": [
                        {
                            "name": "Code",
                            "type": "Matches",
                            "value": "blue"
                        }
                    ]
                },
                {
                    "state": "ReadOnly",
                    "appliesTo": "",
                    "forms": "New;Edit;Display",
                    "conditions": [
                        {
                            "name": "Code",
                            "type": "Matches",
                            "value": "green"
                        }
                    ]
                },
                {
                    "state": "Hidden",
                    "appliesTo": "",
                    "forms": "New;Edit;Display",
                    "conditions": [
                        {
                            "name": "Code",
                            "type": "Matches",
                            "value": "red"
                        }
                    ]
                }
            ],
            "Company": [
                {
                    "state": "Editable",
                    "appliesTo": "Managers",
                    "forms": "New;Edit;Display",
                    "conditions": []
                },
                {
                    "state": "Editable",
                    "appliesTo": "",
                    "forms": "New;Edit;Display",
                    "conditions": [
                        {
                            "name": "Code",
                            "type": "Matches",
                            "value": "blue"
                        }
                    ]
                },
                {
                    "state": "ReadOnly",
                    "appliesTo": "",
                    "forms": "New;Edit;Display",
                    "conditions": [
                        {
                            "name": "Code",
                            "type": "Matches",
                            "value": "green"
                        }
                    ]
                },
                {
                    "state": "Hidden",
                    "appliesTo": "",
                    "forms": "New;Edit;Display",
                    "conditions": [
                        {
                            "name": "Code",
                            "type": "Matches",
                            "value": "red"
                        }
                    ]
                }
            ],
            "JobTitle": [
                {
                    "state": "Editable",
                    "appliesTo": "Managers",
                    "forms": "New;Edit;Display",
                    "conditions": []
                },
                {
                    "state": "Editable",
                    "appliesTo": "",
                    "forms": "New;Edit;Display",
                    "conditions": [
                        {
                            "name": "Code",
                            "type": "Matches",
                            "value": "blue"
                        }
                    ]
                },
                {
                    "state": "ReadOnly",
                    "forms": "New;Edit;Display",
                    "appliesTo": "",
                    "conditions": [
                        {
                            "name": "Code",
                            "type": "Matches",
                            "value": "green"
                        }
                    ]
                },
                {
                    "state": "Hidden",
                    "appliesTo": "",
                    "forms": "New;Edit;Display",
                    "conditions": [
                        {
                            "name": "Code",
                            "type": "Matches",
                            "value": "red"
                        }
                    ]
                }
            ],
            "ContentType": [
                {
                    "state": "Editable",
                    "appliesTo": "Managers",
                    "forms": "New;Edit;Display",
                    "conditions": []
                },
                {
                    "state": "Editable",
                    "appliesTo": "",
                    "forms": "New;Edit;Display",
                    "conditions": [
                        {
                            "name": "Code",
                            "type": "Matches",
                            "value": "blue"
                        }
                    ]
                },
                {
                    "state": "ReadOnly",
                    "appliesTo": "",
                    "forms": "New;Edit;Display",
                    "conditions": [
                        {
                            "name": "Code",
                            "type": "Matches",
                            "value": "green"
                        }
                    ]
                },
                {
                    "state": "Hidden",
                    "appliesTo": "",
                    "forms": "New;Edit;Display",
                    "conditions": [
                        {
                            "name": "Code",
                            "type": "Matches",
                            "value": "red"
                        }
                    ]
                }
            ],
            "EmployeeId": [
                {
                    "state": "Editable",
                    "appliesTo": "HR",
                    "forms": "New;Edit;Display",
                    "conditions": []
                },
                {
                    "state": "ReadOnly",
                    "appliesTo": "Managers",
                    "forms": "New;Edit;Display",
                    "conditions": []
                },
                {
                    "state": "Hidden",
                    "appliesTo": "",
                    "forms": "New;Edit;Display",
                    "conditions": []
                }
            ],
            "HireDate": [
                {
                    "state": "Editable",
                    "forms": "New;Edit;Display",
                    "appliesTo": "HR",
                    "conditions": []
                },
                {
                    "state": "ReadOnly",
                    "forms": "New;Edit;Display",
                    "appliesTo": "Managers",
                    "conditions": []
                },
                {
                    "state": "Hidden",
                    "forms": "New;Edit;Display",
                    "appliesTo": "",
                    "conditions": []
                }
            ],
            "EmergencyContact": [
                {
                    "state": "Editable",
                    "forms": "New;Edit;Display",
                    "appliesTo": "HR",
                    "conditions": []
                },
                {
                    "state": "ReadOnly",
                    "forms": "New;Edit;Display",
                    "appliesTo": "Managers",
                    "conditions": []
                },
                {
                    "state": "Hidden",
                    "forms": "New;Edit;Display",
                    "appliesTo": "",
                    "conditions": []
                }
            ],
            "HomeAddress": [
                {
                    "state": "Editable",
                    "forms": "New;Edit;Display",
                    "appliesTo": "HR",
                    "conditions": []
                },
                {
                    "state": "ReadOnly",
                    "forms": "New;Edit;Display",
                    "appliesTo": "Managers",
                    "conditions": []
                },
                {
                    "state": "Hidden",
                    "forms": "New;Edit;Display",
                    "appliesTo": "",
                    "conditions": []
                }
            ]
        }
    },
    "adapters": {
        "def": {
            "SalesState": {
                "type": "Cascading Lookup",
                "relationshipList": "{6F2FA4DD-0441-4C94-990A-153A753C04AF}",
                "relationshipListParentColumn": "SalesDivision",
                "relationshipListChildColumn": "Title",
                "parentColumnInternal": "SalesDivision",
                "columnNameInternal": "SalesState",
                "relationshipListTitle": "SalesState"
            },
            "JobTitle": {
                "type": "Autocomplete",
                "sourceList": "{C36FFDE6-533F-448B-9FD8-4950D497A3D1}",
                "sourceField": "Title",
                "columnNameInternal": "JobTitle",
                "sourceListTitle": "JobTitles"
            },
            "SalesDivision": {
                "type": "Cascading Lookup",
                "relationshipList": "{9E61B264-8CFE-46B6-99EA-8E0919F1665E}",
                "relationshipListTitle": "SalesDivision",
                "relationshipListParentColumn": "SalesRegion",
                "relationshipListChildColumn": "Title",
                "parentColumnInternal": "SalesRegion",
                "columnNameInternal": "SalesDivision"
            }
        }
    },
    "version": "2014.01.p"
}
