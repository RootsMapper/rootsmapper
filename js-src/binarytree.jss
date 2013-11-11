function BinaryTree() {
    this.Nodes = new Array();
    this.generation = 0;
    this.node = 0;

    this.traverse = function (run, index, callback) {
        var that = this;
        if (index < this.stage.length) {
            run(this.stage[index], function () {
                index++;
                that.traverse(run, index, callback)
            });
        } else {
            typeof callback === 'function' && callback();
        }
    }

    this.IDDFS = function (run, callback) {
        this.stage = new Array();
        for (var i = 0; i < this.generations() + 2; i++) {
            if (i < this.generations() + 1) {
                this.root();
                this.DLS(i);
            } else {
                this.traverse(run, 0, callback);
            }
        }
    }

    this.DLS = function (depth) {
        if (depth == 0) {
            this.stage.push({ node: this.node, generation: this.generation, value: this.getNode() });
        } else {
            if (this.father() !== undefined) {
                this.DLS(depth - 1);
            }
            this.child();
            if (this.mother() !== undefined) {
                this.DLS(depth - 1);
            }
            this.child();
        }
    }

    this.DFS = function (run) {
        run({ node: this.node, generation: this.generation, value: this.getNode() });
        if (this.father() !== undefined) {
            this.DFS(run);
        }
        this.child();
        if (this.mother() !== undefined) {
            this.DFS(run);
        }
        this.child();
    }

    this.generations = function () {
        return Math.ceil(log2(this.Nodes.length)) - 1;
    }

    this.setNode = function (value, generation, node) {
        if (generation === undefined) {
            this.Nodes[this.btSMF(this.generation, this.node)] = value;
        } else {
            this.Nodes[this.btSMF(generation, node)] = value;
        }
    }

    this.getNode = function (generation, node) {
        if (generation === undefined) {
            return this.Nodes[this.btSMF(this.generation, this.node)];
        } else {
            return this.Nodes[this.btSMF(generation, node)];
        }
    }

    this.setNodeByLocation = function (value, location) {
        this.Nodes[location] = value;
    }

    this.getNodeByLocation = function (location) {
        if (location === undefined) {
            return this.Nodes[this.btSMF(this.generation, this.node)];
        } else {
            this.generation = Math.floor(log2(location));
            this.node = location - Math.pow(2, this.generation);
            return this.Nodes[location];
        }
    }

    this.root = function (value) {
        this.generation = 0;
        this.node = 0;
        if (value !== undefined) {
            this.Nodes[this.btSMF(this.generation, this.node)] = value;
        }
        return this.Nodes[this.btSMF(this.generation, this.node)];

    }

    this.mother = function (value) {
        this.generation++
        this.node = this.node * 2 + 1;
        if (value !== undefined) {
            this.Nodes[this.btSMF(this.generation, this.node)] = value;
        }
        return this.Nodes[this.btSMF(this.generation, this.node)];
    }

    this.getMother = function (gen, node) {
        return this.Nodes[this.btSMF(gen + 1, node * 2 + 1)];
    }

    this.father = function (value) {
        this.generation++
        this.node = this.node * 2;
        if (value !== undefined) {
            this.Nodes[this.btSMF(this.generation, this.node)] = value;
        }
        return this.Nodes[this.btSMF(this.generation, this.node)];
    }

    this.getFather = function (gen, node) {
        return this.Nodes[this.btSMF(gen + 1, node * 2)];
    }

    this.child = function (value) {
        this.generation--;
        this.node = this.node >> 1;
        if (value !== undefined) {
            this.Nodes[this.btSMF(this.generation, this.node)] = value;
        }
        return this.Nodes[this.btSMF(this.generation, this.node)];
    }

    this.getChild = function (gen, node) {
        return this.Nodes[this.btSMF(gen - 1, (node >> 1))];
    }

    this.btSMF = function (generation, node) {
        return node + (1 << generation);
    }
}
