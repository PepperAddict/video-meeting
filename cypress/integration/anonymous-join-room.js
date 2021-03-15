describe("Quick In and Join room", function() {

    it("visit it", function() {
        cy.visit("http://localhost:8080")
    })
    it("quickly enter name and join a room ", function() {
        
        cy.get('input[name=name]').type("cypress")
        cy.get('input[name=room]').type("123")
        cy.get('#join').click()
        cy.get('input[name=room]').type('123')
        cy.get('button').click()
    })

})
